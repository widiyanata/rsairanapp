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
  query = "SELECT TOP 10 * FROM kunjunganpasien JOIN PASIEN ON kunjunganpasien.KPKD_PASIEN = PASIEN.KD_PASIEN "

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
    query = "SELECT TOP 10 * FROM mutu_kronologi_kejadian ORDER BY id_kronologi DESC, Tanggal DESC"
    if 'no_transaksi' in request.GET and request.GET['no_transaksi'] is not None and 'dibuat_oleh' in request.GET and request.GET['dibuat_oleh'] is not None:
      no_transaksi = request.GET['no_transaksi']
      dibuat_oleh = json.loads(request.GET['dibuat_oleh']).get('id')
      query = "SELECT TOP 10 * FROM mutu_kronologi_kejadian WHERE no_transaksi = '{}' AND JSON_VALUE(dibuat_oleh, '$.id') = '{}' ORDER BY id_kronologi DESC".format(no_transaksi, dibuat_oleh)

    elif 'dibuat_oleh' in request.GET and request.GET['dibuat_oleh'] is not None:
      dibuat_oleh = json.loads(request.GET['dibuat_oleh']).get('id')
      query = "SELECT TOP 10 * FROM mutu_kronologi_kejadian WHERE JSON_VALUE(dibuat_oleh, '$.id') = '{}' ORDER BY id_kronologi DESC".format(dibuat_oleh)

    print('query kronologi:', query)
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
    tanda_tangan = data.get('tanda_tangan', {})
    kirimke = data.get('kirimke', {})

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
                SET Uraian = %s, dibuat_oleh = %s,
                    tanda_tangan = %s, kirimke = %s, updated_at = %s, tgl_kirim = %s
                WHERE no_transaksi = %s AND dibuat_oleh = %s
            """
            cursor.execute(query, [json.dumps(kejadian), dibuat_oleh, tanda_tangan, kirimke, tgl_sekarang, tgl_sekarang, no_transaksi, dibuat_oleh])
        else:
            # Insert new data
            query = """
                INSERT INTO mutu_kronologi_kejadian 
                (no_transaksi, no_rm, nama_pasien, Tanggal, Uraian, dibuat_oleh, tanda_tangan, kirimke) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, [
                no_transaksi,
                pasien.get('KPKD_PASIEN'),
                pasien.get('KPKD_PASIENN'),
                tgl_sekarang,
                json.dumps(kejadian),
                dibuat_oleh,
                tanda_tangan,
                kirimke
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

# Grading
@csrf_exempt
def grading(request):
  if request.method == 'GET':
    query = """
    SELECT TOP 10 mutu_grading_insiden.*, mutu_investigasi.investigasi, PASIEN.NAMAPASIEN, PASIEN.KD_PASIEN, mutu_investigasi.rekomendasi
    FROM mutu_grading_insiden 
    LEFT JOIN PASIEN ON mutu_grading_insiden.no_rm = PASIEN.KD_PASIEN  
    LEFT JOIN mutu_investigasi ON mutu_investigasi.no_transaksi = mutu_grading_insiden.no_transaksi
    """

    if 'no_transaksi' in request.GET and request.GET['no_transaksi'] is not None:
      no_transaksi = request.GET['no_transaksi']
      query = "SELECT TOP 10 * FROM mutu_grading_insiden JOIN PASIEN ON mutu_grading_insiden.no_rm = PASIEN.KD_PASIEN WHERE no_transaksi = '{}' ".format(no_transaksi)

    print('query grading:', query)

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
    pasien = data.get('pasien', {})
    kejadian = data.get('kejadian', {})
    dibuat_oleh = json.dumps(data.get('dibuat_oleh', {}))

    # Tanda tangan
    tanda_tangan_pelapor = data.get('tanda_tangan_pelapor', '')
    tanda_tangan_penerima = data.get('tanda_tangan_penerima', '')
    penerima_laporan = data.get('penerima_laporan', '')
    print(f'tanda_tangan_pelapor: {tanda_tangan_pelapor}, tanda_tangan_penerima: {tanda_tangan_penerima}')

    print(f'pasien: {pasien}, kejadian: {kejadian}, dibuat_oleh: {dibuat_oleh}')

    with connection.cursor() as cursor:
        # cek existing data
        query = """
            SELECT TOP 1 * FROM mutu_grading_insiden 
            WHERE no_transaksi = %s AND dibuat_oleh = %s
        """
        cursor.execute(query, [pasien.get('KPNO_TRANSAKSI'), dibuat_oleh])
        rows = cursor.fetchone()

        if rows:
          # Update data
          query = """
              UPDATE mutu_grading_insiden
              SET rincian_kejadian = %s,
              dibuat_oleh = %s,
              tanda_tangan_pelapor = %s,
              tanda_tangan_penerima = %s,
              penerima_laporan = %s
              WHERE no_transaksi = %s
              AND dibuat_oleh = %s
          """
          cursor.execute(query, [
            json.dumps(kejadian),
            dibuat_oleh,
            tanda_tangan_pelapor,
            tanda_tangan_penerima,
            penerima_laporan,
            pasien.get('KPNO_TRANSAKSI'),
            dibuat_oleh
          ])
        else:
            # Insert new data
          query = """
            INSERT INTO mutu_grading_insiden 
            (no_rm, no_transaksi, rincian_kejadian, dibuat_oleh, tanda_tangan_pelapor, tanda_tangan_penerima, penerima_laporan) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
          """
          cursor.execute(query, [
              pasien.get('KPKD_PASIEN'),
              pasien.get('KPNO_TRANSAKSI'),
              json.dumps(kejadian),
              dibuat_oleh,
              tanda_tangan_pelapor,
              tanda_tangan_penerima,
              penerima_laporan
          ])

        

    return JsonResponse({'status': True, 'message': 'Data berhasil disimpan'})
  
# Investigasi
@csrf_exempt
def investigasi(request):
  if request.method == 'GET':
    query = "SELECT TOP 10 * FROM mutu_investigasi "

    if 'no_transaksi' in request.GET and request.GET['no_transaksi'] is not None:
      no_transaksi = request.GET['no_transaksi']
      query = "SELECT TOP 10 * FROM mutu_investigasi WHERE no_transaksi = '{}' ".format(no_transaksi)

    print('query investigasi:', query)

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
    pasien = data.get('pasien', {})
    investigasi = data.get('investigasi', {})
    dibuat_oleh = json.dumps(data.get('dibuat_oleh', {}))

    rekomendasi = json.dumps(data.get('rekomendasi', {}))

    print(f'pasien: {pasien}, investigasi: {investigasi}, dibuat_oleh: {dibuat_oleh}')

    # cek data investigasi

    with connection.cursor() as cursor:
        # cek existing data
        query = """
            SELECT TOP 1 * FROM mutu_investigasi 
            WHERE no_transaksi = %s AND dibuat_oleh = %s
        """
        cursor.execute(query, [pasien.get('no_transaksi'), dibuat_oleh])
        rows = cursor.fetchone()

        if rows:
          # Update data
          query = """
              UPDATE mutu_investigasi 
              SET investigasi = %s, dibuat_oleh = %s, rekomendasi = %s
              WHERE no_transaksi = %s AND dibuat_oleh = %s
          """
          cursor.execute(query, [json.dumps(investigasi), dibuat_oleh, rekomendasi, pasien.get('no_transaksi'), dibuat_oleh])
        else:
          # Insert new data
          query = """
              INSERT INTO mutu_investigasi 
              (no_rm, no_transaksi, investigasi, dibuat_oleh, rekomendasi) 
              VALUES (%s, %s, %s, %s, %s)
          """
          cursor.execute(query, [
              pasien.get('KD_PASIEN'),
              pasien.get('no_transaksi'),
              json.dumps(investigasi),
              dibuat_oleh,
              rekomendasi
          ])

    return JsonResponse({'status': True, 'message': 'Data berhasil disimpan'})

  return JsonResponse({'status': False, 'message': 'Method not allowed'})

# Login Perawat
def login(request):
  if request.method == 'POST':
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')

    with connection.cursor() as cursor:
      query = "SELECT TOP 1 * FROM PERAWAT WHERE FMPPERAWAT_ID = %s AND FMPPW = %s"
      cursor.execute(query, [username, password])
      rows = cursor.fetchone()

    if rows:
      res = {
        "status": {
            "success": True,
            "code": 200,
            "message": "Request successful",
        },
        "data": {
          "id": rows[0],
          "username": rows[1],
          "password": rows[2],
          "role": rows[3],
        }
      }

      return JsonResponse(res, safe=False)

    return JsonResponse({
      "status": {
          "success": False,
          "code": 400,
          "message": "Request failed",
      },
      "data": {
        "id": None,
        "username": None,
        "password": None,
        "role": None,
      }
    })
  
  elif request.method == 'GET':
    query = "SELECT TOP 10 * FROM PERAWAT"

    # untuk kedepannya, misalkan ada table yang lain yg dituju
    table = request.GET.get('role', '')
    if table == 'perawat':
      query = "SELECT TOP 10 * FROM PERAWAT"
      # ---------------------------------------------

    if 'cari' in request.GET and request.GET['cari'] is not None:
      username = request.GET['username']
      query = "SELECT TOP 10 FMPPERAWAT_ID, FMPPERAWATN FROM PERAWAT WHERE FMPPERAWATN like '%{}%' ".format(username)

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
        "data": {
          "id": rows[0],
          "username": rows[1],
          "password": rows[2],
          "role": rows[3],
        }
      }

    return JsonResponse(res, safe=False)
  
  return JsonResponse({
    "status": {
        "success": False,
        "code": 400,
        "message": "Request not allowed",
    },
    "data": None
  })

def cariPerawat(request):
  if request.method == 'GET':
    username = request.GET.get('username', '')
    query = "SELECT TOP 10 FMPPERAWAT_ID, FMPPERAWATN FROM PERAWAT WHERE FMPPERAWATN like '%{}%' ".format(username)

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
  
def cek_nik(request):
  if request.method == 'GET':
    nik = request.GET.get('nik', '')
    query = "SELECT FMKKARYAWAN_ID as nik, FMKKARYAWANN as nama, FMKKATEGORI as unit FROM KARYAWAN WHERE FMKKARYAWAN_ID = '{}'".format(nik)

    print("query cek nik:", query)

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

  return JsonResponse({
    "status": {
        "success": False,
        "code": 400,
        "message": "Request not allowed",
    },
    "data": None
  })

# cek nama karyawan
def cek_karyawan(request):
  if request.method == 'GET':
    q = request.GET.get('q', '')
    query = "SELECT FMKKARYAWAN_ID as nik, FMKKARYAWANN as nama, FMKKATEGORI as unit FROM KARYAWAN WHERE FMKKARYAWANN like '%{}%'".format(q)

    print("query cek karyawan:", query)

    with connection.cursor() as cursor:
      cursor.execute(query)
      # dict fetch data
      rows = dictfetchall(cursor)

      res = {
        "status": {
            "success": True,
            "code": 200,
            "message": "Request cek karyawan successful",
        },
        "data": rows
      }

    return JsonResponse(res, safe=False)

  return JsonResponse({
    "status": {
        "success": False,
        "code": 400,
        "message": "Request not allowed",
    },
    "data": None
  })

def cariKaru(request):
  query = "SELECT TOP 10 * FROM mutu_users"

  if 'cari' in request.GET and request.GET['cari'] is not None:
    query = query + "WHERE username LIKE '%{}%' ".format(request.GET['cari'])

  if 'role' in request.GET and request.GET['role'] is not None:
    query = query + " WHERE role = '{}' ".format(request.GET['role'])

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
  
@csrf_exempt
def kirimKronologi(request):
  if request.method == 'POST':
    data = json.loads(request.body)
    
    id_kronologi = data.get('id_kronologi', None)
    kirim_ke = data.get('kirimke', None)

    print(id_kronologi, kirim_ke)

    query = "UPDATE mutu_kronologi_kejadian SET kirimke = '{}' WHERE id_kronologi = '{}'".format(kirim_ke, id_kronologi)

    with connection.cursor() as cursor:
      cursor.execute(query)
      # dict fetch data
      affected_rows = cursor.rowcount

      res = {
        "status": {
            "success": True,
            "code": 200,
            "message": "Kirim kronologi sukses",
        },
        "data": affected_rows
      }

    return JsonResponse(res, safe=False)