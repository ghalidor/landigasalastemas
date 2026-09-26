namespace casinoweb_api.Infrastructure.Logs {
    /// <summary>
    /// Log propio en archivo, uno por dia: logs\registro-2026-09-24.log
    ///
    /// No depende de IIS. La carpeta se configura en appsettings.json
    /// (Logs:Ruta). Si no se puede escribir, se ignora: el registro de la
    /// persona no debe fallar por el log.
    /// </summary>
    /// 
    public static class LogArchivo {
        public static void Escribir(IConfiguration config, string texto) {
            try {
                var carpeta = config["Logs:Ruta"];
                if(string.IsNullOrWhiteSpace(carpeta)) return;

                Directory.CreateDirectory(carpeta);
                var archivo = Path.Combine(carpeta, $"registro-{DateTime.Now:yyyy-MM-dd}.log");
                File.AppendAllText(archivo, $"{DateTime.Now:HH:mm:ss} {texto}{Environment.NewLine}");
            } catch { }
        }
    }
}