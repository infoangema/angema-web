import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule} from '@angular/forms'
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import {HttpClientModule} from '@angular/common/http'

// Rutas
import { APP_ROUTING } from './app.routes';

// Servicios
import { TrabajosService } from './servicio/trabajos.service';
import { BotonesComponent } from './components/botones/botones.component';
import { TarjetaDesplazadasComponent } from './components/tarjeta-desplazadas/tarjeta-desplazadas.component';
import { FooterComponent } from './components/footer/footer.component';
import { ContactoHomeComponent } from './components/contacto-home/contacto-home.component';
import { ContactoComponent } from './components/contacto/contacto.component';
import { BannerCentralComponent } from './banner-central/banner-central.component';
import { from } from 'rxjs';
import { RegistroComponent } from './registro/registro.component';
import { SvgMonitorComponent } from './components/SVG/svg-monitor/svg-monitor.component';
import { SvgCelularComponent } from './components/SVG/svg-celular/svg-celular.component';
import { SvgDisenioComponent } from './components/SVG/svg-disenio/svg-disenio.component';
import { SvgDisenioObjetosComponent } from './components/SVG/svg-disenio-objetos/svg-disenio-objetos.component';
import { TecnologiasComponent } from './components/tecnologias/tecnologias.component';
import { SocioComponent } from './components/socio/socio.component';
import { QuienesSomosComponent } from './components/quienes-somos/quienes-somos.component';
import { PreguntasFrecuentesComponent } from './components/preguntas-frecuentes/preguntas-frecuentes.component';
import { BiComponent } from './components/bi/bi.component';
import { BotonesBiComponent } from './components/botones-bi/botones-bi.component';
import { TextoMovilComponent } from './components/recursos/texto-movil/texto-movil.component';
import { SecuenciaComponent } from './components/recursos/secuencia/secuencia.component';



@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    BotonesComponent,
    TarjetaDesplazadasComponent,
    FooterComponent,
    ContactoHomeComponent,
    ContactoComponent,
    BannerCentralComponent,
    RegistroComponent,
    SvgMonitorComponent,
    SvgCelularComponent,
    SvgDisenioComponent,
    SvgDisenioObjetosComponent,
    TecnologiasComponent,
    SocioComponent,
    QuienesSomosComponent,
    PreguntasFrecuentesComponent,
    BiComponent,
    BotonesBiComponent,
    TextoMovilComponent,
    SecuenciaComponent,
  ],
  imports: [
    BrowserModule,
    APP_ROUTING,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    TrabajosService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
