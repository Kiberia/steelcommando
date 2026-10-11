using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

class MakeGrenade
{
    static bool IsBg(byte r, byte g, byte b)
    {
        int max = Math.Max(r, Math.Max(g, b));
        int min = Math.Min(r, Math.Min(g, b));
        int chroma = max - min;
        if (r >= 200 && g >= 200 && b >= 200 && chroma < 40) return true;
        if (r >= 180 && g >= 180 && b >= 180 && chroma < 35) return true;
        return false;
    }

    static Bitmap KeyAndCrop(Bitmap src)
    {
        int w = src.Width, h = src.Height;
        var srcData = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var buf = new byte[Math.Abs(srcData.Stride) * h];
        Marshal.Copy(srcData.Scan0, buf, 0, buf.Length);
        int stride = Math.Abs(srcData.Stride);
        src.UnlockBits(srcData);

        int minX = w, minY = h, maxX = -1, maxY = -1;
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                int i = y * stride + x * 4;
                byte b = buf[i], g = buf[i + 1], r = buf[i + 2];
                if (IsBg(r, g, b))
                {
                    buf[i + 3] = 0;
                }
                else
                {
                    buf[i + 3] = 255;
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (maxX < 0) throw new Exception("no foreground");

        int pad = 2;
        minX = Math.Max(0, minX - pad);
        minY = Math.Max(0, minY - pad);
        maxX = Math.Min(w - 1, maxX + pad);
        maxY = Math.Min(h - 1, maxY + pad);
        int cw = maxX - minX + 1;
        int ch = maxY - minY + 1;

        var cropped = new Bitmap(cw, ch, PixelFormat.Format32bppArgb);
        var dstData = cropped.LockBits(new Rectangle(0, 0, cw, ch), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        var dst = new byte[Math.Abs(dstData.Stride) * ch];
        int dstride = Math.Abs(dstData.Stride);
        for (int y = 0; y < ch; y++)
        {
            for (int x = 0; x < cw; x++)
            {
                int si = (minY + y) * stride + (minX + x) * 4;
                int di = y * dstride + x * 4;
                dst[di] = buf[si];
                dst[di + 1] = buf[si + 1];
                dst[di + 2] = buf[si + 2];
                dst[di + 3] = buf[si + 3];
            }
        }
        Marshal.Copy(dst, 0, dstData.Scan0, dst.Length);
        cropped.UnlockBits(dstData);
        return cropped;
    }

    static Bitmap ScaleToHeight(Bitmap src, int targetH)
    {
        int tw = Math.Max(16, (int)Math.Round(src.Width * (targetH / (double)src.Height)));
        var scaled = new Bitmap(tw, targetH, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(scaled))
        {
            g.Clear(Color.Transparent);
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.CompositingMode = CompositingMode.SourceOver;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.DrawImage(src, 0, 0, tw, targetH);
        }

        var data = scaled.LockBits(new Rectangle(0, 0, scaled.Width, scaled.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var buf = new byte[Math.Abs(data.Stride) * scaled.Height];
        Marshal.Copy(data.Scan0, buf, 0, buf.Length);
        int stride = Math.Abs(data.Stride);
        for (int y = 0; y < scaled.Height; y++)
        {
            for (int x = 0; x < scaled.Width; x++)
            {
                int i = y * stride + x * 4;
                byte a = buf[i + 3];
                if (a < 40) buf[i + 3] = 0;
                else if (a < 220) buf[i + 3] = 255;
            }
        }
        Marshal.Copy(buf, 0, data.Scan0, buf.Length);
        scaled.UnlockBits(data);
        return scaled;
    }

    static void Main()
    {
        string srcPath = @"C:\Users\MiniMac\.cursor\projects\c-Users-MiniMac-steelcommando\assets\grenade.jpg";
        string outPath = @"C:\Users\MiniMac\steelcommando\assets\hero\grenade.png";

        using (var src = new Bitmap(srcPath))
        using (var argb = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(argb))
                g.DrawImage(src, 0, 0, src.Width, src.Height);

            using (var cropped = KeyAndCrop(argb))
            using (var scaled = ScaleToHeight(cropped, 48))
            {
                scaled.Save(outPath, ImageFormat.Png);
                Console.WriteLine("wrote " + outPath + " " + scaled.Width + "x" + scaled.Height);
            }
        }
    }
}
