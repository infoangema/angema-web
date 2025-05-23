import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-svg-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg-monitor.component.html',
  styleUrls: ['./svg-monitor.component.css']
})
export class SvgMonitorComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }
}
