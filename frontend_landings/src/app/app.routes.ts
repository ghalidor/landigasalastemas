import { Routes } from '@angular/router';
import { contentResolver, venuesResolver, configResolver } from '@core/api/resolvers';
import { authGuard, globalGuard } from '@core/auth/auth.guard';
import { redirectToOriginGuard } from '@core/api/redirect-to-origin.guard';

/**
 * El orden importa: las rutas estáticas van antes que ':slug', o cualquier
 * palabra se interpretaría como una sede.
 */
export const routes: Routes = [
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

  /*
   * Rutas viejas del formulario. Se dejan como redirección porque hay QR
   * impresos apuntando aquí. Todo lo nuevo cuelga de la sede.
   */
  { path: 'registro/:slug/:origin', redirectTo: ':slug/registro/:origin' },
  { path: 'registro/:slug', redirectTo: ':slug/registro' },

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
    path: ':slug/registro/:origin',
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/registro-page.component').then(m => m.RegistroPageComponent),
    resolve: { content: contentResolver },
  },
  {
    path: ':slug/registro',
    canActivate: [redirectToOriginGuard],
    children: [],
  },

  {
    path: ':slug/:origin',
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () =>
      import('@features/landing/pages/casino-page.component').then(m => m.CasinoPageComponent),
    resolve: { content: contentResolver, venues: venuesResolver },
  },
  {
    path: ':slug',
    canActivate: [redirectToOriginGuard],
    children: [],
  },

  { path: '**', redirectTo: '404' },
];