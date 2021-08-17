import { NgModule } from '@angular/core';
import { RouterModule, Routes} from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ContactoComponent } from './components/contacto/contacto.component';
import { QuienesSomosComponent } from './components/quienes-somos/quienes-somos.component';
import { PreguntasFrecuentesComponent } from './components/preguntas-frecuentes/preguntas-frecuentes.component';
import { BiComponent } from './components/bi/bi.component';




const APP_ROUTES: Routes = [
{ path: 'home', component: HomeComponent },
{ path: 'contacto', component: ContactoComponent },
{ path: 'quienesSomos', component: QuienesSomosComponent },
{ path: 'bi', component: BiComponent},
{ path: 'preguntasFrecuentes', component: PreguntasFrecuentesComponent },

{ path: '**', pathMatch: 'full', redirectTo: 'home'},



];

@NgModule({
    imports: [RouterModule.forRoot(APP_ROUTES)],
    exports: [RouterModule]
})
export class APP_ROUTING {}
