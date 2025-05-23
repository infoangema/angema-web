import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-hotel-app',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './hotel-app.component.html',
})
export class HotelAppComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
