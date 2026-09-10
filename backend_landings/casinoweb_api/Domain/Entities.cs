namespace casinoweb_api.Domain {
    public class Entities {
    }
    public class Venue {
        public int Id { get; set; }
        public string CodSala { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string IntroBgImage { get; set; } = string.Empty;
        public string StatusText { get; set; } = string.Empty;
        public string ScheduleText { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal MapLat { get; set; }
        public decimal MapLng { get; set; }
        public string WhatsappNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; }

        // Marca propia de cada sede.
        public string LogoLight { get; set; } = string.Empty;
        public string LogoDark { get; set; } = string.Empty;
        public string ReclamacionesLink { get; set; } = string.Empty;
        public string HotelLink { get; set; } = string.Empty;
        public bool ShowHotelLink { get; set; }

        /*  Portada: la pantalla que sale antes de elegir sala.

            IntroOrder es la posicion, menor primero. ShowInIntro decide si
            sale, y es distinto de IsActive: una sede puede estar fuera de la
            portada y tener su landing funcionando.                          */
        public int IntroOrder { get; set; }
        public bool ShowInIntro { get; set; }

        // Textos para buscadores y para la vista previa al compartir el enlace.
        // Vacio significa que se usa la plantilla del tema.
        public string SeoTitle { get; set; } = string.Empty;
        public string SeoDescription { get; set; } = string.Empty;
        public string SeoImage { get; set; } = string.Empty;
    }

    public class VenueContentVm {
        public Venue Venue { get; set; }
        public Dictionary<string, List<object>> Sections { get; set; } = new();
        public Dictionary<string, string> AppConfig { get; set; } = new();

        /// <summary>Tema con el que se pinta la sede.</summary>
        public string ThemeKey { get; set; } = "classic";
    }

    public class UserPermissionsDto {
        public bool IsGlobal { get; set; }
        public bool CanPublish { get; set; }
    }

    public class AuthUserDto {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public UserPermissionsDto Permissions { get; set; } = new();
        public List<int> AllowedVenueIds { get; set; } = new();
    }
}