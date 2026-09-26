import { Routes } from '@angular/router';
import { contentResolver, venuesResolver, configResolver } from '@core/api/resolvers';
import { authGuard, globalGuard } from '@core/auth/auth.guard';
import { origenPorDefectoResolver } from '@core/api/origen-por-defecto.resolver';
import { dominioDeSedeGuard } from '@core/api/dominio-de-sede.guard';
import { esHashGuard } from '@core/api/es-hash.guard';

/**
 * El orden importa: las rutas estáticas van antes que ':slug', o cualquier
 * palabra se interpretaría como una sede.
 */
export const routes: Routes = [

  /* ===================================================================
     Dominios propios: las mismas paginas, sin el slug en la direccion

     casinodamasco.pe/          la landing de Damasco
     casinodamasco.pe/legal     sus terminos
     casinodamasco.pe/registro/{hash}   un QR suyo

     Los terminos y condiciones de cada sala apuntan a estas direcciones,
     sin slug, asi que tienen que existir tal cual.

     El guard es canMatch, no canActivate: si el dominio no es de ninguna
     sede, la ruta se descarta y el router sigue buscando en las de abajo.
     Por eso la raiz puede ser la landing en casinodamasco.pe y la portada
     en casinowinandwin.pe. En local no coincide ningun dominio, asi que
     todo sigue funcionando con el slug.

     La sede la ponen los resolvers, que la sacan del dominio cuando la
     direccion no la trae.
     =================================================================== */

  {
    path: '',
    canMatch: [dominioDeSedeGuard],
    loadComponent: () =>
      import('@features/landing/pages/casino-page.component').then(m => m.CasinoPageComponent),
    resolve: { content: contentResolver, origen: origenPorDefectoResolver },
  },

  {
    path: 'legal',
    canMatch: [dominioDeSedeGuard],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/legal-page.component').then(m => m.LegalPageComponent),
    resolve: { content: contentResolver },
  },

  {
    path: 'marketing',
    canMatch: [dominioDeSedeGuard],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    data: { marketing: true },
    loadComponent: () =>
      import('@features/landing/pages/registro-page.component').then(m => m.RegistroPageComponent),
    resolve: { content: contentResolver },
  },

  {
    path: 'catalogo',
    canMatch: [dominioDeSedeGuard],
    loadComponent: () =>
      import('@features/landing/pages/catalogo-page.component')
        .then(m => m.CatalogoPageComponent),
    resolve: { content: contentResolver },
  },

  {
    path: 'restaurante',
    canMatch: [dominioDeSedeGuard],
    loadComponent: () =>
      import('@features/landing/pages/catalogo-page.component')
        .then(m => m.CatalogoPageComponent),
    resolve: { content: contentResolver },
  },

  {
    path: 'cyber',
    canMatch: [dominioDeSedeGuard],
    loadComponent: () =>
      import('@features/landing/pages/catalogo-page.component')
        .then(m => m.CatalogoPageComponent),
    resolve: { content: contentResolver },
  },

  /*  El hash tambien se comprueba aqui: la forma vieja /registro/{slug}
      tiene los mismos dos tramos, y sin esto /registro/damasco habria
      abierto el formulario con «damasco» de procedencia.               */
  {
    path: 'registro/:origin',
    canMatch: [dominioDeSedeGuard, esHashGuard],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/registro-page.component').then(m => m.RegistroPageComponent),
    resolve: { content: contentResolver },
  },

  {
    path: 'registro',
    canMatch: [dominioDeSedeGuard],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/registro-page.component').then(m => m.RegistroPageComponent),
    resolve: { content: contentResolver, origen: origenPorDefectoResolver },
  },

  /*  El QR, con el hash a secas.

      En un dominio propio:      casinodamasco.pe/{hash}
      En el dominio compartido:  casinowinandwin.pe/piura/{hash}

      La segunda es la ruta ':slug/:origin' de mas abajo. Antes abria la
      landing con esa procedencia; ahora abre el formulario, igual que la
      primera: la sede la pone el dominio o el slug, y el hash es siempre la
      procedencia.

      El guard del hash es imprescindible. Sin el, esta ruta se tragaria
      cualquier direccion de un solo tramo —/admin incluida— y abriria el
      formulario en vez de lo que toca. Con el, solo entra si el tramo son 32
      caracteres hexadecimales; lo demas sigue su camino normal.

      Los QR viejos, con /registro/{hash}, siguen funcionando: esa ruta no se
      toca, y hay carteles impresos con ella.                            */
  {
    path: ':origin',
    canMatch: [dominioDeSedeGuard, esHashGuard],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/registro-page.component').then(m => m.RegistroPageComponent),
    resolve: { content: contentResolver },
  },

  /* =================================================================== */

  {
    path: '',
    loadComponent: () =>
      import('@features/landing/pages/intro-page.component').then(m => m.IntroPageComponent),
    resolve: { venues: venuesResolver, config: configResolver },
  },

  {
    path: 'admin/login',
    loadComponent: () =>
      import('@features/admin/pages/login-page.component').then(m => m.LoginPageComponent),
  },
  {
    path: 'admin/usuarios',
    canActivate: [globalGuard],
    loadComponent: () =>
      import('@features/admin/pages/users-page.component').then(m => m.UsersPageComponent),
  },
  {
    /*  Configuracion global: ruta propia, no una seccion de /admin.

        Asi queda detras de globalGuard, igual que Gestion de Usuarios. Antes
        se abria con "/admin?seccion=config" y lo unico que la protegia era que
        el menu no la mostrase: escribiendo esa direccion a mano se llegaba
        igual.

        Y de paso, la direccion deja de llevar el parametro de sede, que hacia pensar
        se editaba la configuracion de esa sede.                             */
    path: 'admin/configuracion',
    canActivate: [globalGuard],
    loadComponent: () =>
      import('@features/admin/pages/config-page.component').then(m => m.ConfigPageComponent),
  },
  {
    /*  Orden de la portada. Como Configuracion Global: ruta propia y detras de
        globalGuard, porque decide lo que ve cualquier visitante antes de
        elegir sala y no pertenece a ninguna sede.                           */
    path: 'admin/orden-portada',
    canActivate: [globalGuard],
    loadComponent: () =>
      import('@features/admin/pages/intro-order-page.component')
        .then(m => m.IntroOrderPageComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/admin/pages/admin-page.component').then(m => m.AdminPageComponent),
  },

  { path: '404', loadComponent: () =>
      import('@features/landing/pages/not-found-page.component').then(m => m.NotFoundPageComponent) },

  {
    path: ':slug/legal',
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/legal-page.component').then(m => m.LegalPageComponent),
    resolve: { content: contentResolver },
  },

  /*
   * Formulario de marketing. Dirección fija, sin procedencia en la URL: usa un
   * origen llamado "marketing" que resuelve el backend. No se cruza con
   * /:slug/registro/:origin aunque exista un origen con ese nombre.
   */
  {
    path: ':slug/marketing',
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    data: { marketing: true },
    loadComponent: () =>
      import('@features/landing/pages/registro-page.component').then(m => m.RegistroPageComponent),
    resolve: { content: contentResolver },
  },
  {
    path: ':slug/catalogo',
    loadComponent: () =>
      import('@features/landing/pages/catalogo-page.component')
        .then(m => m.CatalogoPageComponent),
    resolve: { content: contentResolver },
  },

  {
    path: ':slug/restaurante',
    loadComponent: () =>
      import('@features/landing/pages/catalogo-page.component')
        .then(m => m.CatalogoPageComponent),
    resolve: { content: contentResolver },
  },

  {
    /*  La tercera pagina de PDF. Keops, Excalibur y Win Meier tienen una
        seccion Cyber con su propia carta, y sin esta ruta su boton daba 404.

        Las tres usan el mismo componente: cual PDF toca lo deduce el visor de
        cada tema a partir de la direccion.                                  */
    path: ':slug/cyber',
    loadComponent: () =>
      import('@features/landing/pages/catalogo-page.component')
        .then(m => m.CatalogoPageComponent),
    resolve: { content: contentResolver },
  },
  
  /*  El formulario sin QR, en el dominio compartido: lo abre el boton
      Registrate de Piura y de Chiclayo. La procedencia es la marcada por
      defecto, que trae el resolver.                                   */
  {
    path: ':slug/registro',
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/registro-page.component').then(m => m.RegistroPageComponent),
    resolve: { content: contentResolver, origen: origenPorDefectoResolver },
  },

  {
    path: ':slug/:origin',
    canMatch: [esHashGuard],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/registro-page.component').then(m => m.RegistroPageComponent),
    resolve: { content: contentResolver },
  },
  /*
   * La sede sin procedencia en la direccion. Antes esto redirigia a
   * /:slug/{hash}, y el visitante acababa con un hash en la barra que no
   * habia pedido: feo de compartir y una redireccion de mas al arrancar.
   *
   * Ahora carga igual que la de arriba y la procedencia la trae el resolver,
   * que solo hace falta si alguien envia el formulario.
   */
  {
    path: ':slug',
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/casino-page.component').then(m => m.CasinoPageComponent),
    resolve: {
      content: contentResolver,
      venues: venuesResolver,
      origen: origenPorDefectoResolver,
    },
  },

  { path: '**', redirectTo: '404' },
];