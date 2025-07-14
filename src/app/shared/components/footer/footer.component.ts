import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent implements OnInit {
  version = environment.version;
  buildDate = environment.buildDate;
  buildTime = environment.buildTime;

  constructor() {
  }

  ngOnInit(): void {
  }
}
