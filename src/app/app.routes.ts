import { NgModule } from '@angular/core';
import { RouterModule, Routes} from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ContactoComponent } from './components/contacto/contacto.component';
import { RegistroComponent } from './registro/registro.component';
import { QuienesSomosComponent } from './components/quienes-somos/quienes-somos.component';






const APP_ROUTES: Routes = [
{ path: 'home', component: HomeComponent },
{ path: 'contacto', component: ContactoComponent },
{ path: 'registro', component: RegistroComponent },
{ path: 'quienesSomos', component: QuienesSomosComponent },







{ path: '**', pathMatch: 'full', redirectTo: 'home'},



];

@NgModule({
    imports: [RouterModule.forRoot(APP_ROUTES)],
    exports: [RouterModule]
})
export class APP_ROUTING {}
