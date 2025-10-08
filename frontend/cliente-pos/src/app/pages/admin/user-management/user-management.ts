import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css']
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  isLoading = true;
  roles = ['admin', 'empleado', 'cocinero', 'cliente'];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

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
      this.userService.updateUserRole(user.id, newRole).subscribe(() => {
        alert('Rol actualizado con éxito.');
        user.rol = newRole; // Actualiza la vista localmente
      });
    } else {
      // Restaura el valor del select si el usuario cancela
      event.target.value = user.rol;
    }
  }
}
