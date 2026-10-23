package vhuwng.itisacademy.VideoTranscode;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class FfmpegHlsEncoder {

    private final VideoTranscodeProperties properties;

    public void encodeToHls(Path sourceMp4, Path outputDir) throws IOException, InterruptedException {
        Files.createDirectories(outputDir);
        // Master playlist name must match LessonUtil.hlsPlaylistKey (.../hls/master.m3u8)
        Path playlist = outputDir.resolve("master.m3u8");

        String outDir = outputDir.toAbsolutePath().toString();
        List<String> command = new ArrayList<>();
        prependProcessPriority(command);
        command.add(properties.getFfmpegPath());
        command.add("-y");
        command.add("-i");
        command.add(sourceMp4.toAbsolutePath().toString());

        int threads = Math.max(1, properties.getFfmpegThreads());
        command.add("-threads");
        command.add(String.valueOf(threads));
        command.add("-filter_threads");
        command.add(String.valueOf(threads));

        command.add("-filter_complex");
        command.add(
                "[0:v]split=2[v1][v2];"
                        + "[v1]scale=1920:1080:force_original_aspect_ratio=decrease,"
                        + "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v1080];"
                        + "[v2]scale=1280:720:force_original_aspect_ratio=decrease,"
                        + "pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v720]");
        command.add("-map");
        command.add("[v1080]");
        command.add("-map");
        command.add("0:a:0?");
        command.add("-map");
        command.add("[v720]");
        command.add("-map");
        command.add("0:a:0?");

        command.add("-c:v");
        command.add("libx264");
        command.add("-preset");
        command.add(sanitizePreset(properties.getX264Preset()));
        command.add("-c:a");
        command.add("aac");
        command.add("-b:v:0");
        command.add("5000k");
        command.add("-b:v:1");
        command.add("2800k");
        command.add("-b:a");
        command.add("128k");
        // Aligned GOPs help ABR switching (~4s @ 30fps)
        command.add("-g");
        command.add("120");
        command.add("-keyint_min");
        command.add("120");
        command.add("-sc_threshold");
        command.add("0");

        command.add("-f");
        command.add("hls");
        command.add("-hls_time");
        command.add("4");
        command.add("-hls_playlist_type");
        command.add("vod");
        command.add("-hls_segment_type");
        command.add("fmp4");
        command.add("-master_pl_name");
        command.add("master.m3u8");
        command.add("-var_stream_map");
        command.add("v:0,a:0 v:1,a:1");
        command.add("-hls_segment_filename");
        command.add(outDir + "/stream_%v_%03d.m4s");
        command.add(outDir + "/stream_%v.m3u8");

        runProcess(command, "ffmpeg");

        if (!Files.isRegularFile(playlist)) {
            throw new IOException("FFmpeg finished but playlist was not created: " + playlist);
        }
    }

    public Integer probeDurationSeconds(Path sourceMp4) {
        try {
            List<String> command = new ArrayList<>();
            prependProcessPriority(command);
            command.add(properties.getFfprobePath());
            command.add("-v");
            command.add("error");
            command.add("-show_entries");
            command.add("format=duration");
            command.add("-of");
            command.add("default=noprint_wrappers=1:nokey=1");
            command.add(sourceMp4.toAbsolutePath().toString());
            String output = runProcessCapture(command, "ffprobe").trim();
            if (output.isBlank()) {
                return null;
            }
            double seconds = Double.parseDouble(output);
            return (int) Math.round(seconds);
        } catch (Exception e) {
            log.warn("ffprobe duration failed for {}: {}", sourceMp4, e.getMessage());
            return null;
        }
    }

    /**
     * Lowers CPU/I/O priority so the JVM can keep serving HTTP while encoding.
     * Order: {@code nice} then {@code ionice} then the binary.
     */
    private void prependProcessPriority(List<String> command) {
        if (properties.isNiceEnabled()) {
            int nice = Math.clamp(properties.getNiceValue(), 0, 19);
            command.add("nice");
            command.add("-n");
            command.add(String.valueOf(nice));
        }
        if (properties.isIoniceEnabled()) {
            int clazz = Math.clamp(properties.getIoniceClass(), 1, 3);
            int level = Math.clamp(properties.getIoniceLevel(), 0, 7);
            command.add("ionice");
            command.add("-c");
            command.add(String.valueOf(clazz));
            command.add("-n");
            command.add(String.valueOf(level));
        }
    }

    private static String sanitizePreset(String preset) {
        if (preset == null || preset.isBlank()) {
            return "veryfast";
        }
        return switch (preset.trim().toLowerCase()) {
            case "ultrafast", "superfast", "veryfast", "faster", "fast",
                 "medium", "slow", "slower", "veryslow" -> preset.trim().toLowerCase();
            default -> "veryfast";
        };
    }

    private void runProcess(List<String> command, String label) throws IOException, InterruptedException {
        log.info("Running {}: {}", label, String.join(" ", command));
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append('\n');
                log.debug("{}: {}", label, line);
            }
        }

        boolean finished = process.waitFor(2, TimeUnit.HOURS);
        if (!finished) {
            process.destroyForcibly();
            throw new IOException(label + " timed out after 2 hours");
        }
        if (process.exitValue() != 0) {
            String tail = tail(output.toString(), 40);
            throw new IOException(label + " exited with code " + process.exitValue() + ": " + tail);
        }
    }

    private String runProcessCapture(List<String> command, String label) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();
        String output;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            output = reader.lines().reduce((a, b) -> a + "\n" + b).orElse("");
        }
        boolean finished = process.waitFor(2, TimeUnit.MINUTES);
        if (!finished) {
            process.destroyForcibly();
            throw new IOException(label + " timed out");
        }
        if (process.exitValue() != 0) {
            throw new IOException(label + " exited with code " + process.exitValue() + ": " + output);
        }
        return output;
    }

    private static String tail(String text, int maxLines) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String[] lines = text.strip().split("\n");
        int from = Math.max(0, lines.length - maxLines);
        return String.join("\n", java.util.Arrays.copyOfRange(lines, from, lines.length));
    }
}
