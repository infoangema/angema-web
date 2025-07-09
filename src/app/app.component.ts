import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NotificationsComponent],
  template: `
    <router-outlet></router-outlet>
    <app-notifications></app-notifications>
  `
})
export class AppComponent implements OnInit {
  title = 'angema-web';

  ngOnInit(): void {
    initFlowbite();
  }
}
