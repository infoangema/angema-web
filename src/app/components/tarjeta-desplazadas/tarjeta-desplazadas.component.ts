import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgMonitorComponent } from '../SVG/svg-monitor/svg-monitor.component';
import { SvgCelularComponent } from '../SVG/svg-celular/svg-celular.component';
import { SvgDisenioComponent } from '../SVG/svg-disenio/svg-disenio.component';
import { SvgDisenioObjetosComponent } from '../SVG/svg-disenio-objetos/svg-disenio-objetos.component';

@Component({
  selector: 'app-tarjeta-desplazadas',
  standalone: true,
  imports: [
    CommonModule,
    SvgMonitorComponent,
    SvgCelularComponent,
    SvgDisenioComponent,
    SvgDisenioObjetosComponent
  ],
  templateUrl: './tarjeta-desplazadas.component.html',
})
export class TarjetaDesplazadasComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }
}
