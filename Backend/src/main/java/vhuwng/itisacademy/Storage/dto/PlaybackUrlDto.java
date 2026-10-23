package vhuwng.itisacademy.Storage.dto;

/** CDN playback URLs (no presign). Relative HLS segment paths work under the playlist URL. */
public record PlaybackUrlDto(
        String playlistUrl,
        String subtitleUrl
) {
}
