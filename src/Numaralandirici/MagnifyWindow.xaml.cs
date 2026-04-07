using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace Numaralandirici;

public partial class MagnifyWindow : Window
{
    public MagnifyWindow(BitmapImage image, double rotation)
    {
        InitializeComponent();
        PreviewImage.Source = image;

        if (rotation != 0)
            PreviewImage.LayoutTransform = new RotateTransform(rotation);
    }

    private void Window_MouseDown(object sender, MouseButtonEventArgs e) => Close();

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Escape)
            Close();
    }
}
