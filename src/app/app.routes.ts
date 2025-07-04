import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ContactoComponent } from './components/contacto/contacto.component';
import { QuienesSomosComponent } from './components/quienes-somos/quienes-somos.component';
import { PreguntasFrecuentesComponent } from './components/preguntas-frecuentes/preguntas-frecuentes.component';
import { BiComponent } from './components/bi/bi.component';
import { HotelAppComponent } from './components/hotel-app/hotel-app.component';
import { PresupuestosComponent } from './components/presupuestos/presupuestos.component';
import { PresupuestoResumenComponent } from './components/presupuesto-resumen/presupuesto-resumen.component';
import { PresupuestoPlanificacionComponent } from './components/presupuesto-planificacion/presupuesto-planificacion.component';
import { SkuDemoComponent } from './components/sku-demo/sku-demo.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'contacto', component: ContactoComponent },
  { path: 'quienesSomos', component: QuienesSomosComponent },
  { path: 'bi', component: BiComponent },
  { path: 'preguntasFrecuentes', component: PreguntasFrecuentesComponent },
  { path: 'appHotel', component: HotelAppComponent },
  { path: 'presupuestos', component: PresupuestosComponent },
  { path: 'presupuesto-resumen', component: PresupuestoResumenComponent },
  { path: 'presupuesto-planificacion', component: PresupuestoPlanificacionComponent },
  { path: 'sku-demo', component: SkuDemoComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
