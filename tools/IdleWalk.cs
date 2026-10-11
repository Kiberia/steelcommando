using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

/// <summary>
/// Build a continuous 10-frame walk by keeping the idle upper body and
/// remapping the lower body with a classic biped stride (guaranteed continuity).
/// </summary>
class IdleWalk {
  const int FrameW = 480, FrameH = 822, Frames = 10;

  static void Main() {
    string idlePath = @"C:\Users\MiniMac\steelcommando\assets\hero\hero_idle_loop_sheet.png";
    string outPath = @"C:\Users\MiniMac\steelcommando\assets\hero\hero_walk_loop_sheet.png";

    using (var idleSheet = new Bitmap(idlePath))
    using (var idle = idleSheet.Clone(new Rectangle(0, 0, FrameW, FrameH), PixelFormat.Format32bppArgb))
    using (var sheet = new Bitmap(FrameW * Frames, FrameH, PixelFormat.Format32bppArgb)) {
      // Split roughly at hips — keep everything above this from idle (with bob)
      int hipY = FindHipY(idle);
      Console.WriteLine("hipY=" + hipY);

      // Source leg pixels
      var src = Lock(idle);
      try {
        for (int f = 0; f < Frames; f++) {
          double t = f / (double)Frames; // 0..1 over full cycle
          // Classic walk: two steps per cycle
          double phase = t * Math.PI * 2.0;
          int bob = (int)Math.Round(Math.Sin(phase) * 3); // subtle vertical bob

          using (var frame = new Bitmap(FrameW, FrameH, PixelFormat.Format32bppArgb)) {
            ClearTransparent(frame);
            var dst = Lock(frame);
            try {
              // 1) Copy upper body with bob
              for (int y = 0; y < hipY; y++) {
                int sy = Clamp(y - bob, 0, FrameH - 1);
                for (int x = 0; x < FrameW; x++) {
                  CopyPx(src, dst, x, sy, x, y, FrameW);
                }
              }

              // 2) Build legs from idle lower body with horizontal shear per side
              // Left half of lower body = "near" leg strip; right half = "far" — approximate
              // Better: whole lower body with two pivots
              DrawStrideLegs(src, dst, idle, hipY, phase, bob);
            } finally { Unlock(frame, dst); }

            using (var g = Graphics.FromImage(sheet)) {
              g.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
              g.DrawImageUnscaled(frame, f * FrameW, 0);
            }
          }
          Console.WriteLine("frame " + (f + 1));
        }
      } finally { Unlock(idle, src); }

      if (File.Exists(outPath)) File.Delete(outPath);
      sheet.Save(outPath, ImageFormat.Png);
      Console.WriteLine("wrote " + outPath + " cornerA=" + sheet.GetPixel(0, 0).A);
    }
  }

  static void DrawStrideLegs(BitmapData src, BitmapData dst, Bitmap idle, int hipY, double phase, int bob) {
    // Sample stride offsets (pixels). Near leg / far leg alternate.
    // stepA: near forward; stepB: far forward
    double near = Math.Sin(phase);           // +1 forward, -1 back
    double far = Math.Sin(phase + Math.PI);  // opposite

    int nearOffX = (int)Math.Round(near * 22);
    int farOffX = (int)Math.Round(far * 22);
    int nearLift = Math.Max(0, (int)Math.Round((-near) * 18)); // lift when moving forward through air... 
    // Lift when leg is swinging forward (derivative positive-ish): use cos
    double nearSwing = Math.Cos(phase);
    double farSwing = Math.Cos(phase + Math.PI);
    if (nearSwing > 0) nearLift = (int)Math.Round(nearSwing * 16);
    else nearLift = 0;
    int farLift = 0;
    if (farSwing > 0) farLift = (int)Math.Round(farSwing * 16);

    // Find content center of lower body for split
    int midX = FrameW / 2;
    int contentMid = FindLowerCenterX(idle, hipY);
    if (contentMid > 0) midX = contentMid;

    // For each destination pixel in lower body, sample from idle lower with offsets
    for (int y = hipY; y < FrameH; y++) {
      int legT = y - hipY;
      int legH = FrameH - hipY;
      double k = legT / (double)Math.Max(1, legH); // 0 at hip .. 1 at foot
      // Offset grows toward feet
      for (int x = 0; x < FrameW; x++) {
        bool nearSide = x >= midX; // facing right: near leg is typically on the right of sprite in 3/4... 
        // In idle facing right, near (viewer) leg is often the one more to the right of screen for the front leg.
        // Use x relative to mid: left of mid = far leg, right of mid = near leg (common for R-facing 3/4)
        int offX, lift;
        if (x >= midX) { offX = nearOffX; lift = nearLift; }
        else { offX = farOffX; lift = farLift; }

        int sx = Clamp(x - (int)Math.Round(offX * k), 0, FrameW - 1);
        int sy = Clamp(y - bob + (int)Math.Round(lift * k), hipY, FrameH - 1);
        // Prefer sampling opaque; if miss, try without lift
        if (AlphaAt(src, sx, sy, FrameW) < 16) {
          sy = Clamp(y - bob, hipY, FrameH - 1);
          sx = Clamp(x - (int)Math.Round(offX * k * 0.5), 0, FrameW - 1);
        }
        CopyPx(src, dst, sx, sy, x, y, FrameW);
      }
    }

    // Foot plant: ensure bottom rows have contact — already from samples
  }

  static int FindHipY(Bitmap bmp) {
    // Heuristic: first row below 45% height where opaque width expands (hips/pants)
    int yStart = (int)(FrameH * 0.42);
    int best = (int)(FrameH * 0.52);
    int prev = 0;
    for (int y = yStart; y < (int)(FrameH * 0.62); y++) {
      int w = 0;
      for (int x = 0; x < FrameW; x++) {
        if (bmp.GetPixel(x, y).A > 16) w++;
      }
      if (prev > 0 && w > prev + 8) { best = y; break; }
      prev = w;
    }
    return best;
  }

  static int FindLowerCenterX(Bitmap bmp, int hipY) {
    long sum = 0; int n = 0;
    for (int y = hipY; y < FrameH; y += 2) {
      for (int x = 0; x < FrameW; x += 2) {
        if (bmp.GetPixel(x, y).A > 16) { sum += x; n++; }
      }
    }
    return n > 0 ? (int)(sum / n) : FrameW / 2;
  }

  static BitmapData Lock(Bitmap bmp) {
    return bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
  }
  static void Unlock(Bitmap bmp, BitmapData data) { bmp.UnlockBits(data); }

  static void ClearTransparent(Bitmap bmp) {
    using (var g = Graphics.FromImage(bmp)) g.Clear(Color.Transparent);
  }

  static byte AlphaAt(BitmapData data, int x, int y, int w) {
    unsafe {
      // can't use unsafe easily without /unsafe — use Marshal
    }
    IntPtr p = data.Scan0 + y * data.Stride + x * 4;
    byte[] a = new byte[4];
    Marshal.Copy(p, a, 0, 4);
    return a[3];
  }

  static void CopyPx(BitmapData src, BitmapData dst, int sx, int sy, int dx, int dy, int w) {
    IntPtr sp = src.Scan0 + sy * src.Stride + sx * 4;
    IntPtr dp = dst.Scan0 + dy * dst.Stride + dx * 4;
    byte[] px = new byte[4];
    Marshal.Copy(sp, px, 0, 4);
    Marshal.Copy(px, 0, dp, 4);
  }

  static int Clamp(int v, int lo, int hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
  }
}
