using System;
using System.Drawing;
using System.IO;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

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
        public GameWindow(bool selfTest) {
            test = selfTest;
            Text = "克蘇魯的呼喚 — 調查員檔案室";
            ClientSize = new Size(1360, 880); MinimumSize = new Size(400, 600);
            StartPosition = FormStartPosition.CenterScreen; BackColor = Color.FromArgb(16, 27, 29);
            web.Dock = DockStyle.Fill; Controls.Add(web);
            if (test) { ShowInTaskbar = false; Opacity = 0; }
            Load += async (sender, e) => await Initialize();
        }
        private async Task Initialize() {
            try {
                if (test) File.WriteAllText(output, "RUNNING: initializing WebView2");
                if (!File.Exists(Path.Combine(content, "portal.html"))) throw new FileNotFoundException("找不到遊戲內容，請先完整解壓縮應用程式資料夾。");
                string userData = test ? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "test-profile-" + Guid.NewGuid().ToString("N")) : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CthulhuInvestigator", "WebView2");
                var environment = await CoreWebView2Environment.CreateAsync(null, userData);
                await web.EnsureCoreWebView2Async(environment);
                if (test) File.WriteAllText(output, "RUNNING: WebView2 ready");
                web.CoreWebView2.SetVirtualHostNameToFolderMapping("app.cthulhu.example", content, CoreWebView2HostResourceAccessKind.DenyCors);
                web.CoreWebView2.Settings.AreDevToolsEnabled = test;
                web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                web.CoreWebView2.Settings.IsStatusBarEnabled = false;
                web.CoreWebView2.Settings.IsZoomControlEnabled = true;
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
                    using (var image = File.Create(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "desktop-preview.png"))) await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
                    ClientSize = new Size(420, 760);
                    await Task.Delay(250);
                    var mobile = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(checkCompactLayout())");
                    using (var image = File.Create(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compact-preview.png"))) await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
                    File.WriteAllText(output, "{\"rules\":" + rules + ",\"ui\":" + ui + ",\"compact\":" + mobile + "}");
                    Close();
                }
            } catch (Exception ex) { File.WriteAllText(output, "ERROR: " + ex.ToString()); Environment.ExitCode = 1; Close(); }
        }
    }
}
