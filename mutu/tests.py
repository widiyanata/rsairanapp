import time
from unittest import mock

from django.core import signing
from django.test import RequestFactory, SimpleTestCase

from mutu import views


# SimpleTestCase: tidak butuh database, hanya menguji penolakan token/role
class AuthRequiredTest(SimpleTestCase):
  def call(self, view, token=None):
    headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'} if token else {}
    return view(RequestFactory().get('/', **headers)).status_code

  def test_token_dan_role(self):
    lainya = views.make_token({'id': '1', 'username': 'x', 'role': 'lainya'})
    karu = views.make_token({'id': '2', 'username': 'y', 'role': 'karu'})
    admin = views.make_token({'id': '3', 'username': 'z', 'role': 'admin'})
    forged = signing.dumps({'id': '1', 'role': 'admin'}, key='kunci-lain', salt=views.TOKEN_SALT)

    self.assertEqual(self.call(views.userMutu), 401)
    self.assertEqual(self.call(views.userMutu, lainya[:-2] + 'xx'), 401)
    self.assertEqual(self.call(views.userMutu, forged), 401)
    self.assertEqual(self.call(views.userMutu, karu), 403)
    self.assertEqual(self.call(views.updatePermissions, karu), 403)
    self.assertEqual(self.call(views.grading, lainya), 403)

    # kabid: hanya lihat, tidak boleh simpan grading/kronologi, tidak boleh investigasi
    kabid = views.make_token({'id': '4', 'username': 'k', 'role': 'kabid'})
    post = lambda view: view(RequestFactory().post('/', '{}', content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {kabid}')).status_code
    self.assertEqual(post(views.grading), 403)
    self.assertEqual(post(views.kronologi), 403)
    self.assertEqual(self.call(views.investigasi, kabid), 403)
    self.assertEqual(self.call(views.verifikasiKronologi, kabid), 403)
    with mock.patch('time.time', return_value=time.time() + views.TOKEN_MAX_AGE + 10):
      self.assertEqual(self.call(views.userMutu, admin), 401)
