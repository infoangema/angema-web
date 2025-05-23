import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-preguntas-frecuentes',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './preguntas-frecuentes.component.html',
})
export class PreguntasFrecuentesComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }
}
