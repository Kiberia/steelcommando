using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

// Scale every frame to the SAME content height (idle-matched). Width may clamp per-frame.
class BuildWalkUniform {
  static bool IsGreen(byte r, byte g, byte b) {
    return g > 90 && g > r + 35 && g > b + 35;
  }

  static Bitmap KeyGreen(Bitmap src) {
    var rect = new Rectangle(0, 0, src.Width, src.Height);
    var srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    var dst = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
    var dstData = dst.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
    int bytes = Math.Abs(srcData.Stride) * src.Height;
    byte[] buf = new byte[bytes];
    Marshal.Copy(srcData.Scan0, buf, 0, bytes);
    for (int i = 0; i < bytes; i += 4) {
      byte b = buf[i], g = buf[i + 1], r = buf[i + 2];
      if (IsGreen(r, g, b)) buf[i] = buf[i + 1] = buf[i + 2] = buf[i + 3] = 0;
      else buf[i + 3] = 255;
    }
    Marshal.Copy(buf, 0, dstData.Scan0, bytes);
    src.UnlockBits(srcData);
    dst.UnlockBits(dstData);
    return dst;
  }

  static Rectangle OpaqueBounds(Bitmap bmp) {
    int minX = bmp.Width, minY = bmp.Height, maxX = -1, maxY = -1;
    var data = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int stride = Math.Abs(data.Stride);
    byte[] buf = new byte[stride * bmp.Height];
    Marshal.Copy(data.Scan0, buf, 0, buf.Length);
    bmp.UnlockBits(data);
    for (int y = 0; y < bmp.Height; y++) {
      int row = y * stride;
      for (int x = 0; x < bmp.Width; x++) {
        if (buf[row + x * 4 + 3] < 32) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) throw new Exception("empty frame");
    return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
  }

  static void Main() {
    string srcRoot = @"C:\Users\MiniMac\.cursor\projects\c-Users-MiniMac-steelcommando\assets";
    string outPath = @"C:\Users\MiniMac\steelcommando\assets\hero\hero_walk_loop_sheet.png";
    const int frameW = 480, frameH = 822, n = 10;
    const int sidePad = 8, targetH = 800, footY = 816;
    int maxW = frameW - sidePad * 2;

    // Pass 1: crop all, compute ONE global scale that fits every frame
    var crops = new Bitmap[n];
    double globalScale = double.MaxValue;
    for (int i = 1; i <= n; i++) {
      string path = Path.Combine(srcRoot, string.Format("alt{0:D2}.jpg", i));
      if (!File.Exists(path)) path = Path.Combine(srcRoot, string.Format("alt{0:D2}.png", i));
      using (var src = new Bitmap(path))
      using (var keyed = KeyGreen(src)) {
        var b = OpaqueBounds(keyed);
        crops[i - 1] = keyed.Clone(b, PixelFormat.Format32bppArgb);
        double s = Math.Min(maxW / (double)crops[i - 1].Width, targetH / (double)crops[i - 1].Height);
        if (s < globalScale) globalScale = s;
        Console.WriteLine("crop{0}={1}x{2} sMax={3:F3}", i, crops[i - 1].Width, crops[i - 1].Height, s);
      }
    }
    Console.WriteLine("globalScale={0:F4}", globalScale);

    using (var sheet = new Bitmap(frameW * n, frameH, PixelFormat.Format32bppArgb))
    using (var g = Graphics.FromImage(sheet)) {
      g.Clear(Color.Transparent);
      g.CompositingMode = CompositingMode.SourceOver;
      g.InterpolationMode = InterpolationMode.HighQualityBicubic;

      for (int i = 0; i < n; i++) {
        int tw = (int)Math.Round(crops[i].Width * globalScale);
        int th = (int)Math.Round(crops[i].Height * globalScale);
        using (var scaled = new Bitmap(tw, th, PixelFormat.Format32bppArgb))
        using (var sg = Graphics.FromImage(scaled)) {
          sg.Clear(Color.Transparent);
          sg.InterpolationMode = InterpolationMode.HighQualityBicubic;
          sg.DrawImage(crops[i], 0, 0, tw, th);
          int cell = i * frameW;
          int destX = cell + (frameW - tw) / 2;
          int destY = Math.Max(4, footY - th);
          g.DrawImageUnscaled(scaled, destX, destY);
          Console.WriteLine("frame{0} placed={1}x{2}", i + 1, tw, th);
        }
        crops[i].Dispose();
      }

      if (File.Exists(outPath)) File.Delete(outPath);
      sheet.Save(outPath, ImageFormat.Png);
      Console.WriteLine("wrote {0} cornerA={1}", outPath, sheet.GetPixel(0, 0).A);
    }
  }
}
