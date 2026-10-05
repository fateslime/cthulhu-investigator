using System;
using System.Drawing;
using System.IO;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Runtime.Versioning;
using System.Globalization;
using System.Web.Script.Serialization;

[assembly: TargetFramework(".NETFramework,Version=v4.7.2")]

namespace Investigator {
    internal static class Program {
        [STAThread] static void Main(string[] args) {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new GameWindow(args.Length > 0 && args[0] == "--self-test"));
        }
    }
    public sealed class GameWindow : Form {
        private readonly WebView2 web = new WebView2();
        private readonly bool test;
        private readonly string content = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "content");
        private readonly string output = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "runtime-test-results.json");
        private int phase;
        private string rules = "null";
        private bool fullScreen;
        private Rectangle windowedBounds;
        private FormWindowState windowedState;
        private double nativeScale = 1;
        public GameWindow(bool selfTest) {
            test = selfTest;
            Text = "克蘇魯的呼喚 — 調查員檔案室";
            AutoScaleMode = AutoScaleMode.Dpi;
            AutoScaleDimensions = new SizeF(96F, 96F);
            ClientSize = new Size(1600, 1000); MinimumSize = new Size(400, 600);
            StartPosition = FormStartPosition.CenterScreen; BackColor = Color.FromArgb(16, 27, 29);
            web.Dock = DockStyle.Fill; Controls.Add(web);
            if (test) { ShowInTaskbar = false; Opacity = 0; }
            else WindowState = FormWindowState.Maximized;
            Load += async (sender, e) => await Initialize();
        }
        private async Task Initialize() {
            try {
                if (test) File.WriteAllText(output, "RUNNING: initializing WebView2");
                if (!File.Exists(Path.Combine(content, "portal.html"))) throw new FileNotFoundException("找不到遊戲內容，請先完整解壓縮應用程式資料夾。");
                string userData = test ? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "test-profile-" + Guid.NewGuid().ToString("N")) : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CthulhuInvestigator", "WebView2");
                var environment = await CoreWebView2Environment.CreateAsync(null, userData);
                await web.EnsureCoreWebView2Async(environment);
                using (var graphics = CreateGraphics()) nativeScale = graphics.DpiX / 96.0;
                if (test) web.ZoomFactor = 1.0 / nativeScale;
                else MinimumSize = new Size((int)(360 * nativeScale), Math.Min(Screen.FromControl(this).WorkingArea.Height, (int)(560 * nativeScale)));
                if (test) File.WriteAllText(output, "RUNNING: WebView2 ready");
                web.CoreWebView2.SetVirtualHostNameToFolderMapping("app.cthulhu.example", content, CoreWebView2HostResourceAccessKind.DenyCors);
                web.CoreWebView2.Settings.AreDevToolsEnabled = test;
                web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                web.CoreWebView2.Settings.IsStatusBarEnabled = false;
                web.CoreWebView2.Settings.IsZoomControlEnabled = true;
                web.CoreWebView2.WebMessageReceived += (sender, e) => {
                    Uri origin;
                    if (!Uri.TryCreate(e.Source, UriKind.Absolute, out origin) || origin.Scheme != "https" || origin.Host != "app.cthulhu.example") return;
                    try { if (e.TryGetWebMessageAsString() == "toggle-fullscreen") ToggleFullScreen(); } catch (ArgumentException) { }
                };
                web.CoreWebView2.NavigationStarting += (sender, e) => {
                    if (test) File.AppendAllText(output, "\nNAV: " + e.Uri);
                    Uri uri;
                    if (Uri.TryCreate(e.Uri, UriKind.Absolute, out uri) && uri.Scheme == "https" && uri.Host == "app.cthulhu.example") return;
                    e.Cancel = true;
                    if (e.IsUserInitiated) OpenExternal(e.Uri);
                };
                web.CoreWebView2.NewWindowRequested += (sender, e) => { e.Handled = true; if (e.IsUserInitiated) OpenExternal(e.Uri); };
                web.CoreWebView2.DownloadStarting += (sender, e) => {
                    using (var dialog = new SaveFileDialog()) {
                        dialog.FileName = Path.GetFileName(e.ResultFilePath);
                        dialog.Filter = "調查備份 (*.json)|*.json";
                        if (dialog.ShowDialog(this) == DialogResult.OK) { e.ResultFilePath = dialog.FileName; e.Handled = true; }
                        else e.Cancel = true;
                    }
                };
                if (test) web.CoreWebView2.NavigationCompleted += TestNavigation;
                web.CoreWebView2.Navigate("https://app.cthulhu.example/" + (test ? "runtime-tests.html" : "portal.html"));
                if (test) {
                    await Task.Delay(3000);
                    if (!IsDisposed && phase == 0) File.AppendAllText(output, "\nPAGE: " + await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify({url:location.href,state:document.readyState,tests:!!window.RUNTIME_RESULTS,title:document.title})"));
                }
            } catch (Exception ex) {
                if (test) { File.WriteAllText(output, "ERROR: " + ex.ToString()); Environment.ExitCode = 1; Close(); }
                else MessageBox.Show(this, "無法啟動遊戲：" + ex.Message + "\n\n本程式需要 Microsoft Edge WebView2 Evergreen Runtime。安裝說明：https://developer.microsoft.com/microsoft-edge/webview2/", "啟動失敗", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        private void OpenExternal(string address) {
            Uri uri;
            if (Uri.TryCreate(address, UriKind.Absolute, out uri) && uri.Scheme == "https") Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
        }
        private void ToggleFullScreen() {
            if (!fullScreen) {
                windowedState = WindowState;
                windowedBounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
                WindowState = FormWindowState.Normal;
                FormBorderStyle = FormBorderStyle.None;
                Bounds = Screen.FromControl(this).Bounds;
            } else {
                FormBorderStyle = FormBorderStyle.Sizable;
                Bounds = windowedBounds;
                WindowState = windowedState;
            }
            fullScreen = !fullScreen;
        }
        private async void TestNavigation(object sender, CoreWebView2NavigationCompletedEventArgs e) {
            try {
                File.AppendAllText(output, "\nCOMPLETE: " + e.IsSuccess + " / " + phase);
                if (!e.IsSuccess) throw new Exception("Navigation failed: " + e.WebErrorStatus + " at " + web.CoreWebView2.Source);
                if (phase == 0) {
                    for (int i = 0; i < 150; i++) {
                        if (await web.CoreWebView2.ExecuteScriptAsync("!!window.RUNTIME_RESULTS") == "true") break;
                        await Task.Delay(100);
                    }
                    rules = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(window.RUNTIME_RESULTS || {error:'missing test results'})");
                    phase = 1;
                    web.CoreWebView2.Navigate("https://app.cthulhu.example/portal.html");
                } else if (phase == 1) {
                    phase = 2;
                    await web.CoreWebView2.ExecuteScriptAsync(File.ReadAllText(Path.Combine(content, "runtime-ui-tests.js")));
                    await web.CoreWebView2.ExecuteScriptAsync("runRuntimeUiTests()");
                    for (int i = 0; i < 100; i++) {
                        var ready = await web.CoreWebView2.ExecuteScriptAsync("!!window.RUNTIME_UI_RESULTS");
                        if (ready == "true") break;
                        await Task.Delay(100);
                    }
                    var ui = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(window.RUNTIME_UI_RESULTS || {error:'UI timeout'})");
                    await web.CoreWebView2.ExecuteScriptAsync(File.ReadAllText(Path.Combine(content, "cinematic-tests.js")));
                    await web.CoreWebView2.ExecuteScriptAsync("runCinematicTests().then(x=>window.CINEMATIC_RESULTS=x).catch(e=>window.CINEMATIC_RESULTS=[{name:'Cinematic error',pass:false,error:String(e)}])");
                    for (int i = 0; i < 180; i++) {
                        if (await web.CoreWebView2.ExecuteScriptAsync("!!window.CINEMATIC_RESULTS") == "true") break;
                        await Task.Delay(100);
                    }
                    var cinematic = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(window.CINEMATIC_RESULTS || {error:'cinematic timeout'})");
                    using (var image = File.Create(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "desktop-preview.png"))) await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
                    await web.CoreWebView2.ExecuteScriptAsync("window.RESOLUTION_RESULTS=[]");
                    web.ZoomFactor = 1;
                    foreach (var size in new [] { new Size(1366, 768), new Size(1920, 1080), new Size(2560, 1440), new Size(3840, 2160) }) {
                        await web.CoreWebView2.CallDevToolsProtocolMethodAsync("Emulation.setDeviceMetricsOverride", "{\"width\":" + size.Width + ",\"height\":" + size.Height + ",\"deviceScaleFactor\":1,\"mobile\":false}");
                        await Task.Delay(180);
                        var label = size.Width + "x" + size.Height;
                        await web.CoreWebView2.ExecuteScriptAsync("RESOLUTION_RESULTS.push(...checkCinematicLayout('" + label + "'))");
                        var capture = await web.CoreWebView2.CallDevToolsProtocolMethodAsync("Page.captureScreenshot", "{\"format\":\"png\",\"captureBeyondViewport\":false}");
                        var serializer = new JavaScriptSerializer { MaxJsonLength = 32000000 };
                        var screenshot = serializer.Deserialize<System.Collections.Generic.Dictionary<string, string>>(capture);
                        File.WriteAllBytes(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "preview-" + label + ".png"), Convert.FromBase64String(screenshot["data"]));
                    }
                    await web.CoreWebView2.CallDevToolsProtocolMethodAsync("Emulation.clearDeviceMetricsOverride", "{}");
                    web.ZoomFactor = 1.0 / nativeScale;
                    var previousBounds = Bounds;
                    await web.CoreWebView2.ExecuteScriptAsync("chrome.webview.postMessage('toggle-fullscreen')");
                    await Task.Delay(100);
                    bool enteredFullScreen = fullScreen && FormBorderStyle == FormBorderStyle.None;
                    await web.CoreWebView2.ExecuteScriptAsync("chrome.webview.postMessage('toggle-fullscreen')");
                    await Task.Delay(100);
                    await web.CoreWebView2.ExecuteScriptAsync("RESOLUTION_RESULTS.push({name:'Native fullscreen enter and restore',pass:" + (enteredFullScreen && !fullScreen && Bounds == previousBounds).ToString().ToLowerInvariant() + "})");
                    var resolutions = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(RESOLUTION_RESULTS)");
                    ClientSize = new Size(1600, 1000);
                    await Task.Delay(180);
                    await web.CoreWebView2.ExecuteScriptAsync("document.querySelector('[data-ui=\"library\"]').click()");
                    await Task.Delay(180);
                    using (var image = File.Create(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "library-preview.png"))) await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
                    await web.CoreWebView2.ExecuteScriptAsync("document.querySelector('[data-story=\"theatre\"]').click();prepareDicePreview()");
                    await Task.Delay(1100);
                    using (var image = File.Create(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "dice-preview.png"))) await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
                    await web.CoreWebView2.ExecuteScriptAsync("document.querySelector('#dice-overlay')?.close()");
                    ClientSize = new Size(420, 760);
                    await Task.Delay(250);
                    await web.CoreWebView2.ExecuteScriptAsync("window.COMPACT_RESULTS=checkCompactLayout()");
                    using (var image = File.Create(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compact-preview.png"))) await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
                    await web.CoreWebView2.ExecuteScriptAsync("document.querySelector('#hub-close').click();document.querySelector('[data-ui=\"library\"]').click();document.querySelector('[data-story=\"fog\"]').click()");
                    for (int i = 0; i < 100; i++) {
                        if (await web.CoreWebView2.ExecuteScriptAsync("!!document.querySelector('#legacy-game')?.contentWindow?.Cinema") == "true") break;
                        await Task.Delay(50);
                    }
                    var mobile = await web.CoreWebView2.ExecuteScriptAsync("COMPACT_RESULTS.push(...checkLegacyCompactLayout());JSON.stringify(COMPACT_RESULTS)");
                    using (var image = File.Create(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "original-compact-preview.png"))) await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
                    File.WriteAllText(output, "{\"rules\":" + rules + ",\"ui\":" + ui + ",\"cinematic\":" + cinematic + ",\"resolutions\":" + resolutions + ",\"compact\":" + mobile + ",\"nativeDpiScale\":" + nativeScale.ToString(CultureInfo.InvariantCulture) + "}");
                    Close();
                }
            } catch (Exception ex) { File.WriteAllText(output, "ERROR: " + ex.ToString()); Environment.ExitCode = 1; Close(); }
        }
    }
}
