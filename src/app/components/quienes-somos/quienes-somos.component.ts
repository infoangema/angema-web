import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-quienes-somos',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './quienes-somos.component.html',
})
export class QuienesSomosComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }
}
