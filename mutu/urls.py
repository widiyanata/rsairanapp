from django.urls import path
from . import views

app_name = 'mutu'
urlpatterns = [
  path('', views.index, name='index'),
  path('kunjunganPasien', views.kunjungan_pasien, name='kunjungan-pasien'),
  path('kronologi', views.kronologi, name='kronologi'),
  path('cariUser', views.cari_user, name='cari_user'),
  path('grading', views.grading, name='grading'),
  path('investigasi', views.investigasi, name='investigasi'),
  path('cekNik', views.cek_nik, name='cek_nik'),
  path('cekKaryawan', views.cek_karyawan, name='cek_karyawan'),
  path('cariKaru', views.cariKaru, name='cariKaru'),
  path('kirimKronologi', views.kirimKronologi, name='kirimKronologi'),
]
