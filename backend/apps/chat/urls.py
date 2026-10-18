"""URLs for chat app."""

from django.urls import path

from apps.chat.views import ChatMessageStreamView, ThreadDetailView, ThreadListCreateView

urlpatterns = [
    path("threads/", ThreadListCreateView.as_view(), name="chat-thread-list-create"),
    path("threads/<uuid:thread_id>/", ThreadDetailView.as_view(), name="chat-thread-detail"),
    path("threads/<uuid:thread_id>/messages/", ChatMessageStreamView.as_view(), name="chat-thread-messages"),
]
