import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'exito' | 'error' | 'informativo';
  texto: string;
}

const DURACION = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private siguienteId = 1;

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto);
  }

  informativo(texto: string): void {
    this.mostrar('informativo', texto);
  }

  cerrar(id: number): void {
    this._toasts.update(lista => lista.filter(t => t.id !== id));
  }

  private mostrar(tipo: Toast['tipo'], texto: string): void {
    const id = this.siguienteId++;

    this._toasts.update(lista => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), DURACION);
  }
}
