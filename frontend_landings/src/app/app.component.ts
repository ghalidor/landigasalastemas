import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '@shared/toast-container.component';
import AOS from 'aos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: '<router-outlet /><app-toasts />',
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 50 });
  }
}
