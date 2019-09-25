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
  { path: 'logout',
    loadChildren: () => import('./pages/logout/logout.module').then(m => m.LogoutPageModule)
  },
  { path: 'stock-picking/:id',
    loadChildren: () => import('./pages/stock-picking/stock-picking.module').then(m => m.StockPickingPageModule)
  },
  { path: 'stock-picking-list',
    loadChildren: () => import('./pages/stock-picking-list/stock-picking-list.module').then(m => m.StockPickingListPageModule)
  },
  { path: 'product/:id',
    loadChildren: () => import('./pages/product/product.module').then(m => m.ProductPageModule)
  },
  { path: 'product-list',
    loadChildren: () => import('./pages/product-list/product-list.module').then(m => m.ProductListPageModule)
   },
  
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}