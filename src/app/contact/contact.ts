import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactMessage } from '../services/contact';

@Component({
  selector: 'app-contact-messages',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class ContactMessages implements OnInit {
  messages = signal<ContactMessage[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searchQuery = signal('');

  expandedId = signal<string | null>(null);

  currentPage = signal(1);
  totalPages = signal(0);
  totalMessages = signal(0);
  limit = 10;

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.isLoading.set(true);
    this.contactService.getAll(this.searchQuery(), this.currentPage(), this.limit).subscribe({
      next: (res) => {
        this.messages.set(res.data);

        if (res.pagination) {
          this.totalPages.set(res.pagination.totalPages);
          this.totalMessages.set(res.pagination.total);
        } else {
          this.totalPages.set(0);
          this.totalMessages.set(res.data.length);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load messages');
        this.isLoading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadMessages();
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }
  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  preview(message: string): string {
    return message.length > 60 ? message.slice(0, 60) + '...' : message;
  }
  markAsRead(id: string, event: Event): void {
  event.stopPropagation(); 
  this.contactService.markAsRead(id).subscribe({
    next: () => {
      this.messages.update((list) =>
        list.map((msg) => (msg._id === id ? { ...msg, status: 'read' } : msg))
      );
    },
  });
}
}