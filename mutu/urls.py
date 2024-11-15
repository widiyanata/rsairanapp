from django.urls import path
from . import views

app_name = 'mutu'
urlpatterns = [
  path('', views.index, name='index'),
  path('kunjunganPasien', views.kunjungan_pasien, name='kunjungan-pasien'),
  path('kronologi', views.kronologi, name='kronologi'),
  path('cariUser', views.cari_user, name='cari_user'),
]
