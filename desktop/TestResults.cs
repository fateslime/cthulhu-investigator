using System;
using System.Collections.Generic;
using System.Web.Script.Serialization;

namespace Investigator {
    // ExecuteScriptAsync returns JSON that encodes a JSON-array string.
    // Missing, empty, malformed and non-Boolean pass values must fail closed.
    public static class TestResults {
        public static bool AllPassed(params string[] groups) {
            if (groups == null || groups.Length == 0) return false;
            var json = new JavaScriptSerializer { MaxJsonLength = 32000000 };
            try {
                foreach (var encoded in groups) {
                    var text = json.DeserializeObject(encoded) as string;
                    if (text == null) return false;
                    var rows = json.DeserializeObject(text) as object[];
                    if (rows == null || rows.Length == 0) return false;
                    foreach (var item in rows) {
                        var row = item as Dictionary<string, object>;
                        object pass, name;
                        if (row == null || !row.TryGetValue("pass", out pass) || !(pass is bool) || !(bool)pass ||
                            !row.TryGetValue("name", out name) || !(name is string) || String.IsNullOrWhiteSpace((string)name)) return false;
                    }
                }
                return true;
            } catch { return false; }
        }
    }
}
