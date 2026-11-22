# About-page video

The institutional video on `/quienes-somos` is independent of the decorative landing-page video. It keeps sound and only assigns its media source when the visitor presses the play button. Native controls appear after that interaction. There is no autoplay or loop, and the full 16:9 frame is shown without cropping.

## Files

- Player: `src/modules/quienes-somos/components/about-video-section.tsx`.
- Placement: after the introduction in `src/modules/quienes-somos/views/quienes-somos-view.tsx`.
- Delivery: [versioned Cloudinary MP4](https://res.cloudinary.com/trsbzk8f/video/upload/v1795346887/koru/quienes-somos/institucional-1080p.mp4).
- Cloudinary public ID: `koru/quienes-somos/institucional-1080p`.
- The MP4 is no longer bundled under `public`; an ignored local backup remains at `node_modules/.cache/koru-video/1080p-crf23.mp4`.
- Poster: `public/assets/videos/koru-institucional-poster.jpg`.
- Tests: `tests/integration/about-video-section.test.mjs`.

The section is fixed content, not a new CMS video-upload field. Existing text/image editing and the landing video are unchanged.

## Encoding evidence

| File | Bytes | Notes |
| --- | ---: | --- |
| Original | 308,691,294 | H.264 High, 1920x1080, 24000/1001 FPS, AAC stereo 48 kHz |
| CRF20 comparison | 120,828,152 | SSIM 0.990253 against the original |
| Selected CRF23 | 84,200,192 | SSIM 0.987075; approximately 72.7% smaller |
| JPEG poster | 95,163 | 1280x720 frame extracted at 25 seconds |

Both comparison encodes use H.264 `libx264`, `-preset slow`, `yuv420p`, AAC at 160 kb/s and `-movflags +faststart`. Source frame rate and 1080p resolution are retained. Encoded duration is 153.621 seconds versus 153.611792 seconds for the original container. The selected MP4 has its `moov` atom before `mdat`.

Four sampled frames were compared visually and whole-video SSIM was measured. SSIM is structural similarity, not a percentage of perceived quality. Sampled stills do not establish full motion quality, audio quality or device compatibility. Human playback approval remains necessary.

The source and comparison files are retained locally under ignored `node_modules/.cache/koru-video/`; they are not delivery assets or tracked source. The original is never overwritten. No remote upload is performed by the player.

## Delivery and acceptance

The user-authorized one-time migration uploaded the already optimized MP4 to Cloudinary using the existing SDK, a file read stream and 6,000,000-byte chunks. The upload used `resource_type: video`, `overwrite: false`, a dedicated public ID, and no extra compression, audio removal or derived transformations. Credentials were consumed only by the local Node process, never exposed to the browser. This was a media upload, not a website deployment or Git publication.

Cloudinary returned `existing: false`, 84,200,192 bytes, H.264 1920x1080, duration 153.621 seconds and AAC stereo audio at 48 kHz. A complete download of the versioned CDN URL matched the local source and preserved backup byte-for-byte (SHA-256 `2c8a08e2a15a97e9ba3aa85a1070c702a2c3c0f1fd47f05047e56fae609cf42e`). Requests for bytes 0-1023 and 84199168-84200191 each returned HTTP 206 with the correct `Content-Range` and 1,024-byte body. Only after these checks was the public MP4 removed. The small JPEG poster remains local.

The account usage check reported a Free plan with 6.97 of 25 credits used before upload. This proves the observed available account budget, not unlimited future delivery or a separately advertised maximum video size. The upload itself confirmed acceptance of this file. At 84.2 MB per complete transfer, 1,000 complete transfers represent approximately 84.2 GB before caching and partial-view effects. Cloudinary CDN delivery still consumes bandwidth and account quota. Monitor it; this migration does not add a budget monitor or adaptive streaming.

The player assigns the direct HTTPS Cloudinary URL only on a user gesture, without a Next.js proxy, download endpoint, signed expiry or silent landing derivative. The source and poster are fixed content, not CMS-editable. A future replacement should use a separately verified asset/version and must not overwrite the landing video.

Verify the actual server/CDN returns the correct video content type and supports byte ranges and seeking. Inspect the browser network panel: before pressing play there must be no request for the MP4; loading the JPEG poster is expected. Check playback with sound, pause/resume, seeking, fullscreen, connection errors and retry on desktop, Safari/iPhone and Chrome/Android. Verify keyboard access and no layout shift. Test a limited connection before deciding whether an additional rendition or adaptive streaming is needed.

Captions were not supplied and have not been fabricated. Spoken content still needs a reviewed caption file for accessibility.

Run the deterministic component and landing regression checks with:

```sh
node --test tests/integration/about-video-section.test.mjs tests/integration/landing-video-download.test.mjs
```

These tests exercise rendered element props and event handlers with a lightweight hook/media harness. They do not simulate actual browser fetching, codecs, audio output or React DOM hydration.
