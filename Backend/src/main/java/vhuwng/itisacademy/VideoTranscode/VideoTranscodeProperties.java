package vhuwng.itisacademy.VideoTranscode;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "video.transcode")
public class VideoTranscodeProperties {
    /** Redis list key used as the job queue. */
    private String queueKey = "video:transcode";
    /** When true, this process polls Redis and runs FFmpeg. */
    private boolean workerEnabled = true;
    private String ffmpegPath = "ffmpeg";
    private String ffprobePath = "ffprobe";
    private String workDir = System.getProperty("java.io.tmpdir") + "/itis-transcode";
    private long blockTimeoutSeconds = 5;

    private int ffmpegThreads = 1;


    private String x264Preset = "veryfast";

    private boolean niceEnabled = true;
    private int niceValue = 19;

    private boolean ioniceEnabled = true;
    private int ioniceClass = 2;
    private int ioniceLevel = 7;
}
