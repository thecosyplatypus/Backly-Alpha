Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Collections.Generic;

public class WindowsIconGenerator
{
    public static void Create(string sourcePath, string destinationPath, int[] sizes)
    {
        using (Image source = Image.FromFile(sourcePath))
        {
            var frames = new List<byte[]>();
            foreach (int size in sizes)
            {
                using (Bitmap bitmap = new Bitmap(size, size, System.Drawing.Imaging.PixelFormat.Format32bppArgb))
                using (Graphics graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.Transparent);
                    graphics.CompositingQuality = CompositingQuality.HighQuality;
                    graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    graphics.SmoothingMode = SmoothingMode.HighQuality;
                    graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    graphics.DrawImage(source, 0, 0, size, size);

                    using (MemoryStream pngStream = new MemoryStream())
                    {
                        bitmap.Save(pngStream, System.Drawing.Imaging.ImageFormat.Png);
                        frames.Add(pngStream.ToArray());
                    }
                }
            }

            using (FileStream output = new FileStream(destinationPath, FileMode.Create))
            using (BinaryWriter writer = new BinaryWriter(output))
            {
                writer.Write((ushort)0); // Reserved
                writer.Write((ushort)1); // Icon type
                writer.Write((ushort)frames.Count);

                int offset = 6 + (frames.Count * 16);
                for (int i = 0; i < frames.Count; i++)
                {
                    int size = sizes[i];
                    writer.Write((byte)(size >= 256 ? 0 : size));
                    writer.Write((byte)(size >= 256 ? 0 : size));
                    writer.Write((byte)0);  // Color count
                    writer.Write((byte)0);  // Reserved
                    writer.Write((ushort)1); // Planes
                    writer.Write((ushort)32); // Bit count
                    writer.Write((uint)frames[i].Length);
                    writer.Write((uint)offset);
                    offset += frames[i].Length;
                }

                foreach (byte[] frame in frames)
                {
                    writer.Write(frame);
                }
            }
        }
    }
}
"@ -ReferencedAssemblies System.Drawing

$sizes = @(16, 20, 24, 32, 40, 48, 64, 96, 128, 256)
[WindowsIconGenerator]::Create("resources/icon.png", "resources/icon.ico", $sizes)
Write-Output "Generated resources/icon.ico"
