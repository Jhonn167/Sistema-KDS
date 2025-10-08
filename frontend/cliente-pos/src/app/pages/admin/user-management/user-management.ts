// src/app/pages/admin/user-management/user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- 1. IMPORTA FormsModule
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- 2. AÑÁDELO A LOS IMPORTS
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css']
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  isLoading = true;
  roles = ['admin', 'empleado', 'cocinero', 'cliente'];

  constructor(private userService: UserService) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe(data => {
      this.users = data;
      this.isLoading = false;
    });
  }

  onRoleChange(user: any, event: any): void {
    const newRole = event.target.value;
    if (confirm(`¿Estás seguro de que quieres cambiar el rol de ${user.nombre} a ${newRole}?`)) {
      this.userService.updateUserRole(user.id, newRole).subscribe({
        next: () => {
          alert('Rol actualizado con éxito.');
          user.rol = newRole;
        },
        error: (err) => {
          alert('Error al actualizar el rol.');
          event.target.value = user.rol; // Restaura el valor visual si falla
        }
      });
    } else {
      event.target.value = user.rol;
    }
  }
}
