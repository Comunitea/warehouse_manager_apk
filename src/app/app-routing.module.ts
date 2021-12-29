import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'login/:logout',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  { path: 'logout',
    loadChildren: () => import('./pages/logout/logout.module').then(m => m.LogoutPageModule)
  },
  { path: 'stock-picking/:id',
    loadChildren: () => import('./pages/stock-picking/stock-picking.module').then(m => m.StockPickingPageModule)
  },
  { path: 'stock-picking',
  loadChildren: () => import('./pages/stock-picking/stock-picking.module').then(m => m.StockPickingPageModule)
  },
  { path: 'stock-picking/:id/:code',
    loadChildren: () => import('./pages/stock-picking/stock-picking.module').then(m => m.StockPickingPageModule)
  },
  { path: 'stock-picking-list',
    loadChildren: () => import('./pages/stock-picking-list/stock-picking-list.module').then(m => m.StockPickingListPageModule)
  },
  { path: 'stock-picking-list/:id/:filter',
    loadChildren: () => import('./pages/stock-picking-list/stock-picking-list.module').then(m => m.StockPickingListPageModule)
  },
  { path: 'product/:id',
    loadChildren: () => import('./pages/product/product.module').then(m => m.ProductPageModule)
  },
  { path: 'product-list',
    loadChildren: () => import('./pages/product-list/product-list.module').then(m => m.ProductListPageModule)
   },
   { path: 'stock-location-list',
    loadChildren: () => import('./pages/stock-location-list/stock-location-list.module').then(m => m.StockLocationListPageModule)
   },
   { path: 'stock-location/:id',
    loadChildren: () => import('./pages/stock-location/stock-location.module').then(m => m.StockLocationPageModule)
  },
  { path: 'stock-location/:id/:product_id',
    loadChildren: () => import('./pages/stock-location/stock-location.module').then(m => m.StockLocationPageModule)
  },
  { path: 'stock-location/:id/:product_id/:inventory_id',
    loadChildren: () => import('./pages/stock-location/stock-location.module').then(m => m.StockLocationPageModule)
  },
  { path: 'stock-quant-list/:id',
    loadChildren: () => import('./pages/stock-quant-list/stock-quant-list.module').then(m => m.StockQuantListPageModule)
  },
  { path: 'stock-location-product-list/:id',
    loadChildren: () => import('./pages/stock-location-product-list/stock-location-product-list.module').then(m => m.StockLocationProductListPageModule)
  },
  { path: 'stock-picking-type-list',
    loadChildren: () => import('./pages/stock-picking-type-list/stock-picking-type-list.module').then(m => m.StockPickingTypeListPageModule)
  },
  { path: 'stock-move-location',
    loadChildren: () => import('./pages/stock-move-location/stock-move-location.module').then(m => m.StockMoveLocationPageModule)
   },
  { path: 'move-line-form/:id',
    loadChildren: () => import ('./pages/move-line-form/move-line-form.module').then(m => m.MoveLineFormPageModule)
  },
  { path: 'move-form/:id',
    loadChildren: () => import ('./pages/move-form/move-form.module').then(m => m.MoveFormPageModule)
  },
  { path: 'info-sale-order/:object/:id',
  loadChildren: () => import ('./pages/info-sale-order/info-sale-order.module').then(m => m.InfoSaleOrderPageModule)
  },
  { path: 'barcode-multiline/:inventory/:location/:product',
  loadChildren: () => import ('./pages/barcode-multiline/barcode-multiline.module').then(m => m.BarcodeMultilinePageModule)
  },
  { path: 'navegacion-principal',
  loadChildren: () => import ('./pages/navegacion-principal/navegacion-principal.module').then(m => m.NavegacionPrincipalPageModule)
  },
  { path: 'navegacion-albaranes', loadChildren: './pages/navegacion-albaranes/navegacion-albaranes.module#NavegacionAlbaranesPageModule' },
  { path: 'listado-albaranes', loadChildren: './pages/listado-albaranes/listado-albaranes.module#ListadoAlbaranesPageModule' },
  { path: 'listado-albaranes/:id', loadChildren: './pages/listado-albaranes/listado-albaranes.module#ListadoAlbaranesPageModule' },
  { path: 'move-list/:BatchId', loadChildren: './pages/move-list/move-list.module#MoveListPageModule' },
  { path: 'inventory', loadChildren: './pages/inventory/inventory.module#InventoryPageModule' },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, onSameUrlNavigation: 'reload' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
