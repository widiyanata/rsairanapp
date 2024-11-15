import datetime
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
    query = "SELECT TOP 10 * FROM mutu_kronologi_kejadian "
    if 'no_transaksi' in request.GET and request.GET['no_transaksi'] is not None:
      no_transaksi = request.GET['no_transaksi']
      dibuat_oleh = json.loads(request.GET['dibuat_oleh']).get('user_id')
      query = "SELECT TOP 10 * FROM mutu_kronologi_kejadian WHERE no_transaksi = '{}' AND JSON_VALUE(dibuat_oleh, '$.user_id') = '{}' ".format(no_transaksi, dibuat_oleh)

    print(query)
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

    # Get data components
    pasien = data.get('pasien', {})
    kejadian = data.get('kejadian', {})
    dibuat_oleh = json.dumps(data.get('dibuat_oleh', {}))

    # Log the received data
    print(f'pasien: {pasien}, kejadian: {kejadian}, dibuat_oleh: {dibuat_oleh}')

    # Current timestamp
    tgl_sekarang = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Get transaction number
    no_transaksi = pasien.get('KPNO_TRANSAKSI')

    if not all([no_transaksi, dibuat_oleh]):
        return JsonResponse({'status': False, 'message': 'Missing required fields'}, status=400)
    
    with connection.cursor() as cursor:
        # Check existing transaction
        query = """
            SELECT TOP 1 * FROM mutu_kronologi_kejadian 
            WHERE no_transaksi = %s AND dibuat_oleh = %s
        """
        cursor.execute(query, [no_transaksi, dibuat_oleh])
        rows = cursor.fetchone()

        if rows:
            # Update data
            query = """
                UPDATE mutu_kronologi_kejadian 
                SET Uraian = %s, dibuat_oleh = %s 
                WHERE no_transaksi = %s AND dibuat_oleh = %s
            """
            cursor.execute(query, [json.dumps(kejadian), dibuat_oleh, no_transaksi, dibuat_oleh])
        else:
            # Insert new data
            query = """
                INSERT INTO mutu_kronologi_kejadian 
                (no_transaksi, no_rm, nama_pasien, Tanggal, Uraian, dibuat_oleh) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, [
                no_transaksi,
                pasien.get('KPKD_PASIEN'),
                pasien.get('KPKD_PASIENN'),
                tgl_sekarang,
                json.dumps(kejadian),
                dibuat_oleh
            ])

    return JsonResponse({'status': True, 'message': 'Data berhasil disimpan'})

# Cari user
def cari_user(request):
  query = "SELECT TOP 10 * FROM PERAWAT "

  if 'cari' in request.GET and request.GET['cari'] is not None:
    query = query + "WHERE FMPPERAWATN LIKE '%{}%' ".format(request.GET['cari'])

  print(query)
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
    