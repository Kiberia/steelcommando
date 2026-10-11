using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

class BuildWalk {
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
      if (IsGreen(r, g, b)) {
        buf[i] = buf[i + 1] = buf[i + 2] = buf[i + 3] = 0;
      } else {
        buf[i + 3] = 255;
      }
    }
    Marshal.Copy(buf, 0, dstData.Scan0, bytes);
    src.UnlockBits(srcData);
    dst.UnlockBits(dstData);
    return dst;
  }

  static Rectangle OpaqueBounds(Bitmap bmp) {
    int minX = bmp.Width, minY = bmp.Height, maxX = -1, maxY = -1;
    var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
    var data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
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
    if (maxX < 0) throw new Exception("empty");
    return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
  }

  static void Main() {
    string srcRoot = @"C:\Users\MiniMac\.cursor\projects\c-Users-MiniMac-steelcommando\assets";
    string outPath = @"C:\Users\MiniMac\steelcommando\assets\hero\hero_walk_loop_sheet.png";
    const int frameW = 480, frameH = 822, n = 10;
    const int sidePad = 8, targetH = 800, footY = 816;
    int maxW = frameW - sidePad * 2;

    var crops = new Bitmap[n];
    var widths = new int[n];
    var heights = new int[n];
    for (int i = 0; i < n; i++) {
      string path = Path.Combine(srcRoot, string.Format("seq{0:D2}.jpg", i + 1));
      using (var src = new Bitmap(path))
      using (var keyed = KeyGreen(src)) {
        var b = OpaqueBounds(keyed);
        crops[i] = keyed.Clone(b, PixelFormat.Format32bppArgb);
        widths[i] = crops[i].Width;
        heights[i] = crops[i].Height;
        Console.WriteLine("frame{0} {1}x{2}", i + 1, crops[i].Width, crops[i].Height);
      }
    }

    // Ignore single widest outlier so one bad crop doesn't shrink the whole cycle
    var wSorted = (int[])widths.Clone(); Array.Sort(wSorted);
    var hSorted = (int[])heights.Clone(); Array.Sort(hSorted);
    int maxCW = wSorted[n - 2]; // 2nd max width
    int maxCH = hSorted[n - 1];
    double scale = Math.Min(maxW / (double)maxCW, targetH / (double)maxCH);
    Console.WriteLine("scale={0} ref={1}x{2}", scale, maxCW, maxCH);

    using (var sheet = new Bitmap(frameW * n, frameH, PixelFormat.Format32bppArgb))
    using (var g = Graphics.FromImage(sheet)) {
      g.Clear(Color.Transparent);
      g.CompositingMode = CompositingMode.SourceOver;
      g.InterpolationMode = InterpolationMode.HighQualityBicubic;
      for (int i = 0; i < n; i++) {
        // Per-frame scale from same factor; clamp width if needed
        int tw = (int)Math.Round(crops[i].Width * scale);
        int th = (int)Math.Round(crops[i].Height * scale);
        if (tw > maxW) {
          double s2 = maxW / (double)crops[i].Width;
          tw = maxW;
          th = (int)Math.Round(crops[i].Height * s2);
        }
        Console.WriteLine("place{0} {1}x{2}", i + 1, tw, th);
        using (var scaled = new Bitmap(tw, th, PixelFormat.Format32bppArgb))
        using (var sg = Graphics.FromImage(scaled)) {
          sg.Clear(Color.Transparent);
          sg.InterpolationMode = InterpolationMode.HighQualityBicubic;
          sg.DrawImage(crops[i], 0, 0, tw, th);
          int destX = i * frameW + (frameW - tw) / 2;
          int destY = Math.Max(4, footY - th);
          g.DrawImageUnscaled(scaled, destX, destY);
        }
        crops[i].Dispose();
      }
      if (File.Exists(outPath)) File.Delete(outPath);
      sheet.Save(outPath, ImageFormat.Png);
      var c = sheet.GetPixel(0, 0);
      Console.WriteLine("wrote {0} cornerA={1}", outPath, c.A);
    }
  }
}
