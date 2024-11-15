import json
from django.db import connection
from django.http import JsonResponse
from django.shortcuts import render

# csrf exempt
from django.views.decorators.csrf import csrf_exempt

def dictfetchall(cursor):
  "Return all rows from a cursor as a dict"
  columns = [col[0] for col in cursor.description]
  return [
    dict(zip(columns, row))
    for row in cursor.fetchall()
  ]

def index(request):

  res = {
    "status": {
        "success": True,
        "code": 200,
        "message": "Request successful",
    },
    "data": {
        "id": 1,
        "name": "Item Name",
        "description": "Item Description"
    }
  }

  return JsonResponse(res)

# Get kunjungan pasien
def kunjungan_pasien(request):
  query = "SELECT TOP 10 * FROM kunjunganpasien "

  if 'cari' in request.GET and request.GET['cari'] is not None:
    query = query + "WHERE KPKD_PASIEN LIKE '%{}%' OR KPKD_PASIENN LIKE '%{}%' OR KPNO_TRANSAKSI LIKE '%{}%' ".format(request.GET['cari'], request.GET['cari'], request.GET['cari'])

  with connection.cursor() as cursor:
    cursor.execute(query)
    # dict fetch data
    rows = dictfetchall(cursor)

    res = {
      "status": {
          "success": True,
          "code": 200,
          "message": "Request successful",
      },
      "data": rows
    }

    return JsonResponse(res, safe=False)
  
@csrf_exempt
def kronologi(request):
  if request.method == 'GET':
    query = "SELECT TOP 100 * FROM mutu_kronologi_kejadian "
    if 'no_transaksi' in request.GET and request.GET['no_transaksi'] is not None:
      no_transaksi = request.GET['no_transaksi']
      query = "SELECT TOP 100 * FROM mutu_kronologi_kejadian WHERE no_transaksi = '{}' ".format(no_transaksi)

    with connection.cursor() as cursor:
      cursor.execute(query)
      # dict fetch data
      rows = dictfetchall(cursor)

      res = {
        "status": {
            "success": True,
            "code": 200,
            "message": "Request successful",
        },
        "data": rows
      }

    return JsonResponse(res, safe=False)

  elif request.method == 'POST':
    data = json.loads(request.body)

    # get data pasien
    pasien = data.get('pasien')

    # get data kejadian
    kejadian = data.get('kejadian')

    # log
    print(f'pasien: {pasien}, kejadian: {kejadian}')

    with connection.cursor() as cursor:
      # insert data kejadian
      query = "INSERT INTO mutu_kronologi_kejadian (no_transaksi, no_rm, nama, Tanggal, Uraian, dibuat_oleh) VALUES ('{}', '{}')".format(pasien['KPNO_TRANSAKSI'], json.dumps(kejadian))
      cursor.execute(query)

    return JsonResponse({'status': True, 'message': 'Data berhasil disimpan'})
