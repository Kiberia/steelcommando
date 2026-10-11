using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

class BuildWalkOrdered {
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
    return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
  }

  // Foot mass relative X in lower band (0..1)
  static double FootRel(Bitmap bmp) {
    var b = OpaqueBounds(bmp);
    int y0 = b.Y + (int)(b.Height * 0.78);
    double sum = 0; int n = 0;
    var data = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int stride = Math.Abs(data.Stride);
    byte[] buf = new byte[stride * bmp.Height];
    Marshal.Copy(data.Scan0, buf, 0, buf.Length);
    bmp.UnlockBits(data);
    for (int y = y0; y < b.Y + b.Height; y++) {
      int row = y * stride;
      for (int x = b.X; x < b.X + b.Width; x++) {
        if (buf[row + x * 4 + 3] < 40) continue;
        sum += x;
        n++;
      }
    }
    if (n == 0) return 0.5;
    return (sum / n - b.X) / Math.Max(1, b.Width);
  }

  static void Main() {
    string srcRoot = @"C:\Users\MiniMac\.cursor\projects\c-Users-MiniMac-steelcommando\assets";
    string outPath = @"C:\Users\MiniMac\steelcommando\assets\hero\hero_walk_loop_sheet.png";
    const int frameW = 480, frameH = 822, n = 10;
    const int sidePad = 8, targetH = 800, footY = 816;
    int maxW = frameW - sidePad * 2;

    var crops = new Bitmap[n];
    var foot = new double[n];
    for (int i = 0; i < n; i++) {
      using (var src = new Bitmap(Path.Combine(srcRoot, string.Format("seq{0:D2}.jpg", i + 1))))
      using (var keyed = KeyGreen(src)) {
        var b = OpaqueBounds(keyed);
        crops[i] = keyed.Clone(b, PixelFormat.Format32bppArgb);
        foot[i] = FootRel(crops[i]);
        Console.WriteLine("src{0} foot={1:F3} size={2}x{3}", i + 1, foot[i], crops[i].Width, crops[i].Height);
      }
    }

    // Ideal walk footRel ~ 0.5 + 0.12*sin(phase) — pick best unused source for each slot
    bool[] used = new bool[n];
    int[] order = new int[n];
    for (int slot = 0; slot < n; slot++) {
      double phase = slot / (double)n * Math.PI * 2.0;
      double ideal = 0.5 + 0.12 * Math.Sin(phase);
      int best = -1; double bestD = 1e9;
      for (int i = 0; i < n; i++) {
        if (used[i]) continue;
        double d = Math.Abs(foot[i] - ideal);
        if (d < bestD) { bestD = d; best = i; }
      }
      used[best] = true;
      order[slot] = best;
      Console.WriteLine("slot{0} <- src{1} (ideal={2:F3} got={3:F3})", slot + 1, best + 1, ideal, foot[best]);
    }

    // Uniform scale from 2nd-max width
    int[] widths = new int[n];
    int maxCH = 0;
    for (int i = 0; i < n; i++) {
      widths[i] = crops[i].Width;
      if (crops[i].Height > maxCH) maxCH = crops[i].Height;
    }
    Array.Sort(widths);
    int maxCW = widths[n - 2];
    double scale = Math.Min(maxW / (double)maxCW, targetH / (double)maxCH);

    using (var sheet = new Bitmap(frameW * n, frameH, PixelFormat.Format32bppArgb))
    using (var g = Graphics.FromImage(sheet)) {
      g.Clear(Color.Transparent);
      g.CompositingMode = CompositingMode.SourceOver;
      g.InterpolationMode = InterpolationMode.HighQualityBicubic;
      for (int slot = 0; slot < n; slot++) {
        var crop = crops[order[slot]];
        int tw = (int)Math.Round(crop.Width * scale);
        int th = (int)Math.Round(crop.Height * scale);
        if (tw > maxW) {
          double s2 = maxW / (double)crop.Width;
          tw = maxW;
          th = (int)Math.Round(crop.Height * s2);
        }
        using (var scaled = new Bitmap(tw, th, PixelFormat.Format32bppArgb))
        using (var sg = Graphics.FromImage(scaled)) {
          sg.Clear(Color.Transparent);
          sg.InterpolationMode = InterpolationMode.HighQualityBicubic;
          sg.DrawImage(crop, 0, 0, tw, th);
          int destX = slot * frameW + (frameW - tw) / 2;
          int destY = Math.Max(4, footY - th);
          g.DrawImageUnscaled(scaled, destX, destY);
        }
      }
      if (File.Exists(outPath)) File.Delete(outPath);
      sheet.Save(outPath, ImageFormat.Png);
      Console.WriteLine("wrote " + outPath + " cornerA=" + sheet.GetPixel(0, 0).A);
    }
    for (int i = 0; i < n; i++) crops[i].Dispose();
  }
}
