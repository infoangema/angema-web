import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banner-central',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner-central.component.html',
})
export class BannerCentralComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }
}
