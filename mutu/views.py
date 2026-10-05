import datetime
import json
import requests
from django.db import connection
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

def dictfetchall(cursor):
  "Return all rows from a cursor as a dict"
  columns = [col[0] for col in cursor.description]
  return [
    dict(zip(columns, row))
    for row in cursor.fetchall()
  ]

def send_wa_notification(phone, message):
  if not phone:
    print("No phone number provided, skipping WA notification.")
    return False
  try:
    url = "http://localhost:8010/send-message"
    res = requests.post(url, json={"phone": phone, "message": message}, timeout=5)
    print(f"WA notification status: {res.status_code}, response: {res.text}")
    return res.status_code == 200
  except Exception as e:
    print(f"Error calling WA service: {e}")
    return False

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
  params = []

  if 'cari' in request.GET and request.GET['cari'] is not None:
    cari_val = f"%{request.GET['cari']}%"
    query = query + "WHERE KPKD_PASIEN LIKE %s OR KPKD_PASIENN LIKE %s OR KPNO_TRANSAKSI LIKE %s "
    params = [cari_val, cari_val, cari_val]

  with connection.cursor() as cursor:
    cursor.execute(query, params)
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
    params = []
    
    if 'no_transaksi' in request.GET and request.GET['no_transaksi'] is not None and 'dibuat_oleh' in request.GET and request.GET['dibuat_oleh'] is not None:
      no_transaksi = request.GET['no_transaksi']
      dibuat_oleh = json.loads(request.GET['dibuat_oleh']).get('id')
      query = "SELECT TOP 10 * FROM mutu_kronologi_kejadian WHERE no_transaksi = %s AND JSON_VALUE(dibuat_oleh, '$.id') = %s ORDER BY id_kronologi DESC"
      params = [no_transaksi, dibuat_oleh]

    elif 'dibuat_oleh' in request.GET and request.GET['dibuat_oleh'] is not None:
      dibuat_oleh = json.loads(request.GET['dibuat_oleh']).get('id')
      query = "SELECT TOP 10 * FROM mutu_kronologi_kejadian WHERE JSON_VALUE(dibuat_oleh, '$.id') = %s ORDER BY id_kronologi DESC"
      params = [dibuat_oleh]

    print('query kronologi:', query, 'params:', params)
    with connection.cursor() as cursor:
      cursor.execute(query, params)
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
    kirimke = data.get('kirimke', '')

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
                    tanda_tangan = %s, updated_at = %s
                WHERE no_transaksi = %s AND dibuat_oleh = %s
            """
            cursor.execute(query, [json.dumps(kejadian), dibuat_oleh, tanda_tangan, tgl_sekarang, no_transaksi, dibuat_oleh])
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
  params = []

  if 'cari' in request.GET and request.GET['cari'] is not None:
    query = query + "WHERE FMPPERAWATN LIKE %s "
    params = [f"%{request.GET['cari']}%"]

  print(query)
  with connection.cursor() as cursor:
    cursor.execute(query, params)
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
    SELECT mutu_grading_insiden.*, mutu_investigasi.investigasi, PASIEN.NAMAPASIEN, PASIEN.KD_PASIEN, mutu_investigasi.rekomendasi, mutu_verifikasi.status as verifikasi
    FROM mutu_grading_insiden 
    LEFT JOIN PASIEN ON mutu_grading_insiden.no_rm = PASIEN.KD_PASIEN  
    LEFT JOIN mutu_investigasi ON mutu_investigasi.no_transaksi = mutu_grading_insiden.no_transaksi
    LEFT JOIN mutu_verifikasi ON mutu_grading_insiden.no_transaksi = mutu_verifikasi.no_transaksi
    ORDER BY mutu_grading_insiden.id_insiden DESC
    """
    params = []

    if 'no_transaksi' in request.GET and request.GET['no_transaksi'] is not None:
      no_transaksi = request.GET['no_transaksi']
      query = """
      SELECT mutu_grading_insiden.*, PASIEN.NAMAPASIEN, PASIEN.KD_PASIEN 
      FROM mutu_grading_insiden 
      LEFT JOIN PASIEN ON mutu_grading_insiden.no_rm = PASIEN.KD_PASIEN 
      WHERE no_transaksi = %s 
      ORDER BY mutu_grading_insiden.id_insiden DESC
      """
      params = [no_transaksi]

    with connection.cursor() as cursor:
      cursor.execute(query, params)
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

    # Tanda tangan & verifikasi
    tanda_tangan_pelapor = data.get('tanda_tangan_pelapor', '')
    tanda_tangan_penerima = data.get('tanda_tangan_penerima', '')
    penerima_laporan = data.get('penerima_laporan', '')
    status_verifikasi_kasie = data.get('status_verifikasi_kasie')
    verified_by_kasie = data.get('verified_by_kasie')
    verified_by_kasie_str = json.dumps(verified_by_kasie) if verified_by_kasie else None
    kirim_ke_kasie = data.get('kirim_ke_kasie')

    if not status_verifikasi_kasie:
      status_verifikasi_kasie = 'TERVERIFIKASI' if tanda_tangan_penerima else 'MENUNGGU_VERIFIKASI'

    no_transaksi = pasien.get('KPNO_TRANSAKSI') or data.get('no_transaksi')
    no_rm = pasien.get('KPKD_PASIEN') or pasien.get('KD_PASIEN') or data.get('no_rm')

    with connection.cursor() as cursor:
        # cek existing data berdasarkan no_transaksi
        query = """
            SELECT TOP 1 * FROM mutu_grading_insiden 
            WHERE no_transaksi = %s
        """
        cursor.execute(query, [no_transaksi])
        existing = dictfetchall(cursor)

        if len(existing) > 0:
          existing_row = existing[0]
          final_ttd_pelapor = tanda_tangan_pelapor or existing_row.get('tanda_tangan_pelapor')
          final_ttd_penerima = tanda_tangan_penerima or existing_row.get('tanda_tangan_penerima')
          final_penerima = penerima_laporan or existing_row.get('penerima_laporan')
          final_dibuat_oleh = existing_row.get('dibuat_oleh') or dibuat_oleh
          final_verified_by = verified_by_kasie_str or existing_row.get('verified_by_kasie')
          final_kirim_ke_kasie = kirim_ke_kasie or existing_row.get('kirim_ke_kasie')

          # Update data
          query = """
              UPDATE mutu_grading_insiden
              SET rincian_kejadian = %s,
              dibuat_oleh = %s,
              tanda_tangan_pelapor = %s,
              tanda_tangan_penerima = %s,
              penerima_laporan = %s,
              status_verifikasi_kasie = %s,
              tgl_verifikasi_kasie = CASE WHEN %s = 'TERVERIFIKASI' THEN GETDATE() ELSE tgl_verifikasi_kasie END,
              verified_by_kasie = %s,
              kirim_ke_kasie = %s,
              updated_at = GETDATE()
              WHERE no_transaksi = %s
          """
          cursor.execute(query, [
            json.dumps(kejadian),
            final_dibuat_oleh,
            final_ttd_pelapor,
            final_ttd_penerima,
            final_penerima,
            status_verifikasi_kasie,
            status_verifikasi_kasie,
            final_verified_by,
            final_kirim_ke_kasie,
            no_transaksi
          ])
        else:
          final_kirim_ke_kasie = kirim_ke_kasie
          # Insert new data
          query = """
            INSERT INTO mutu_grading_insiden 
            (no_rm, no_transaksi, rincian_kejadian, dibuat_oleh, tanda_tangan_pelapor, tanda_tangan_penerima, penerima_laporan, status_verifikasi_kasie, tgl_verifikasi_kasie, verified_by_kasie, kirim_ke_kasie, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CASE WHEN %s = 'TERVERIFIKASI' THEN GETDATE() ELSE NULL END, %s, %s, GETDATE(), GETDATE())
          """
          cursor.execute(query, [
              no_rm,
              no_transaksi,
              json.dumps(kejadian),
              dibuat_oleh,
              tanda_tangan_pelapor,
              tanda_tangan_penerima,
              penerima_laporan,
              status_verifikasi_kasie,
              status_verifikasi_kasie,
              verified_by_kasie_str,
              final_kirim_ke_kasie
          ])

    # Trigger WA notifications
    try:
      insiden_nama = kejadian.get('insiden', 'Insiden Tanpa Nama')
      warna_grading = kejadian.get('gradingrisiko', 'TIDAK ADA').upper()
      nama_pasien = pasien.get('NAMAPASIEN', 'Pasien Tanpa Nama')
      no_trans = no_transaksi

      with connection.cursor() as cursor:
        if status_verifikasi_kasie == 'TERVERIFIKASI':
          cursor.execute("SELECT nama, telp FROM mutu_users WHERE role = 'mutu'")
          mutu_users = dictfetchall(cursor)
          kasie_nama = penerima_laporan or 'Kasie'
          for mu in mutu_users:
            if mu.get('telp'):
              msg = f"Halo {mu['nama']},\n\nLaporan grading insiden untuk pasien {nama_pasien} (No. Trans: {no_trans}) telah DIVERIFIKASI dan ditandatangani oleh Kasie ({kasie_nama}).\n\nDetail Insiden: {insiden_nama}\nGrade Risiko: {warna_grading}\n\nMohon segera lakukan investigasi di aplikasi IKP-Mutu."
              send_wa_notification(mu['telp'], msg)
        else:
          if final_kirim_ke_kasie:
            cursor.execute("SELECT nama, telp FROM mutu_users WHERE id = %s", [final_kirim_ke_kasie])
            target_kasie = dictfetchall(cursor)
            for ku in target_kasie:
              if ku.get('telp'):
                msg = f"Halo {ku['nama']},\n\nLaporan grading insiden baru telah dikirimkan ke Anda oleh Karu untuk pasien {nama_pasien} (No. Trans: {no_trans}).\n\nDetail Insiden: {insiden_nama}\nGrade Risiko: {warna_grading}\n\nMohon segera lakukan verifikasi dan tanda tangan di aplikasi IKP-Mutu."
                send_wa_notification(ku['telp'], msg)
          else:
            cursor.execute("SELECT nama, telp FROM mutu_users WHERE role = 'kasie'")
            kasie_users = dictfetchall(cursor)
            for ku in kasie_users:
              if ku.get('telp'):
                msg = f"Halo {ku['nama']},\n\nLaporan grading insiden baru telah diselesaikan oleh Karu untuk pasien {nama_pasien} (No. Trans: {no_trans}).\n\nDetail Insiden: {insiden_nama}\nGrade Risiko: {warna_grading}\n\nMohon segera lakukan verifikasi dan tanda tangan di aplikasi IKP-Mutu."
                send_wa_notification(ku['telp'], msg)
    except Exception as e:
      print(f"Error triggering WA notification for grading: {e}")

    return JsonResponse({'status': True, 'message': 'Data grading berhasil disimpan'})
  
# Investigasi
@csrf_exempt
def investigasi(request):
  if request.method == 'GET':
    query = "SELECT TOP 10 * FROM mutu_investigasi "
    params = []

    if 'no_transaksi' in request.GET and request.GET['no_transaksi'] is not None:
      no_transaksi = request.GET['no_transaksi']
      query = "SELECT TOP 10 * FROM mutu_investigasi WHERE no_transaksi = %s "
      params = [no_transaksi]

    print('query investigasi:', query)

    with connection.cursor() as cursor:
      cursor.execute(query, params)
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
    params = []

    table = request.GET.get('role', '')
    if table == 'perawat':
      query = "SELECT TOP 10 * FROM PERAWAT"

    if 'cari' in request.GET and request.GET['cari'] is not None:
      username = request.GET['username']
      query = "SELECT TOP 10 FMPPERAWAT_ID, FMPPERAWATN FROM PERAWAT WHERE FMPPERAWATN like %s "
      params = [f"%{username}%"]

    print(query)

    with connection.cursor() as cursor:
      cursor.execute(query, params)
      rows = dictfetchall(cursor)

      res = {
        "status": {
            "success": True,
            "code": 200,
            "message": "Request successful",
        },
        "data": {
          "id": rows[0]['FMPPERAWAT_ID'] if rows else None,
          "username": rows[0]['FMPPERAWATN'] if rows else None,
          "password": rows[0]['FMPPW'] if rows else None,
          "role": rows[0]['FMPJABATAN'] if rows else None,
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
    query = "SELECT TOP 10 FMPPERAWAT_ID, FMPPERAWATN FROM PERAWAT WHERE FMPPERAWATN like %s "

    with connection.cursor() as cursor:
      cursor.execute(query, [f"%{username}%"])
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
    query = "SELECT FMKKARYAWAN_ID as nik, FMKKARYAWANN as nama, FMKKATEGORI as unit FROM KARYAWAN WHERE FMKKARYAWAN_ID = %s"

    with connection.cursor() as cursor:
      cursor.execute(query, [nik])
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
    query = "SELECT FMKKARYAWAN_ID as nik, FMKKARYAWANN as nama, FMKKATEGORI as unit FROM KARYAWAN WHERE FMKKARYAWANN like %s"

    with connection.cursor() as cursor:
      cursor.execute(query, [f"%{q}%"])
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
  query = "SELECT id, username, role, nama, telp FROM mutu_users"
  conditions = []
  params = []

  if 'cari' in request.GET and request.GET['cari'] is not None:
    conditions.append("(username LIKE %s OR nama LIKE %s)")
    params.extend([f"%{request.GET['cari']}%", f"%{request.GET['cari']}%"])

  if 'role' in request.GET and request.GET['role'] is not None:
    conditions.append("role = %s")
    params.append(request.GET['role'])

  if conditions:
    query = query + " WHERE " + " AND ".join(conditions)

  query = query + " ORDER BY nama ASC"

  with connection.cursor() as cursor:
    cursor.execute(query, params)
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

    query = "UPDATE mutu_kronologi_kejadian SET kirimke = %s WHERE id_kronologi = %s"

    with connection.cursor() as cursor:
      cursor.execute(query, [kirim_ke, id_kronologi])
      affected_rows = cursor.rowcount

      # Trigger WA notification to Karu
      try:
        cursor.execute("SELECT no_transaksi, nama_pasien, dibuat_oleh FROM mutu_kronologi_kejadian WHERE id_kronologi = %s", [id_kronologi])
        kron_rows = dictfetchall(cursor)
        
        cursor.execute("SELECT nama, telp FROM mutu_users WHERE id = %s", [kirim_ke])
        karu_rows = dictfetchall(cursor)

        if kron_rows and karu_rows:
          kron = kron_rows[0]
          karu = karu_rows[0]
          
          pelapor = '-'
          try:
            pelapor = json.loads(kron['dibuat_oleh']).get('username', '-')
          except:
            pass
            
          if karu.get('telp'):
            msg = f"Halo {karu['nama']},\n\nLaporan kronologi insiden baru telah dikirim ke Anda untuk pasien {kron['nama_pasien']} (No. Trans: {kron['no_transaksi']}) oleh {pelapor}.\n\nMohon segera lakukan grading risiko di aplikasi IKP-Mutu."
            send_wa_notification(karu['telp'], msg)
      except Exception as e:
        print(f"Error triggering WA notification for kirimKronologi: {e}")

      res = {
        "status": {
            "success": True,
            "code": 200,
            "message": "Kirim kronologi sukses",
        },
        "data": affected_rows
      }
    return JsonResponse(res, safe=False)
  
def userMutu(request):
  query = "SELECT * FROM mutu_users"

  with connection.cursor() as cursor:
    cursor.execute(query)
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
def createUserMutu(request):
  if request.method == 'POST':
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    nama = data.get('nama')
    telp = data.get('telp', '')

    if not all([username, password, role, nama]):
      return JsonResponse({'status': False, 'message': 'Missing required fields'}, status=400)

    from django.contrib.auth.hashers import make_password
    hashed_password = make_password(password)

    with connection.cursor() as cursor:
      # Check if username already exists
      cursor.execute("SELECT id FROM mutu_users WHERE username = %s", [username])
      if cursor.fetchone():
        return JsonResponse({'status': False, 'message': 'Username already exists'}, status=400)

      query = """
          INSERT INTO mutu_users (username, password, role, nama, telp) 
          VALUES (%s, %s, %s, %s, %s)
      """
      cursor.execute(query, [username, hashed_password, role, nama, telp])

    return JsonResponse({'status': True, 'message': 'User berhasil ditambahkan'})
  return JsonResponse({'status': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def updateUserMutu(request):
  if request.method == 'POST':
    data = json.loads(request.body)
    id_user = data.get('id')
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    nama = data.get('nama')
    telp = data.get('telp', '')

    if not all([id_user, username, role, nama]):
      return JsonResponse({'status': False, 'message': 'Missing required fields'}, status=400)

    with connection.cursor() as cursor:
      # Check if username exists on another user
      cursor.execute("SELECT id FROM mutu_users WHERE username = %s AND id != %s", [username, id_user])
      if cursor.fetchone():
        return JsonResponse({'status': False, 'message': 'Username already exists'}, status=400)

      if password:
        from django.contrib.auth.hashers import make_password
        hashed_password = make_password(password)
        query = """
            UPDATE mutu_users 
            SET username = %s, password = %s, role = %s, nama = %s, telp = %s 
            WHERE id = %s
        """
        cursor.execute(query, [username, hashed_password, role, nama, telp, id_user])
      else:
        query = """
            UPDATE mutu_users 
            SET username = %s, role = %s, nama = %s, telp = %s 
            WHERE id = %s
        """
        cursor.execute(query, [username, role, nama, telp, id_user])

    return JsonResponse({'status': True, 'message': 'User berhasil diperbarui'})
  return JsonResponse({'status': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def deleteUserMutu(request):
  if request.method == 'POST':
    data = json.loads(request.body)
    id_user = data.get('id')

    if not id_user:
      return JsonResponse({'status': False, 'message': 'Missing user ID'}, status=400)

    with connection.cursor() as cursor:
      cursor.execute("DELETE FROM mutu_users WHERE id = %s", [id_user])

    return JsonResponse({'status': True, 'message': 'User berhasil dihapus'})
  return JsonResponse({'status': False, 'message': 'Method not allowed'}, status=405)

@csrf_exempt
def loginMutu(request):
  if request.method == 'POST':
    data = json.loads(request.body)
    print('data login mutu:', data)
    username = data.get('username')
    password = data.get('password')

    with connection.cursor() as cursor:
      query = "SELECT TOP 1 id, username, role, nama, password, telp FROM mutu_users WHERE username = %s"
      cursor.execute(query, [username])
      rows = dictfetchall(cursor)

    if rows:
      user_data = rows[0]
      db_password = user_data.get('password')
      
      from django.contrib.auth.hashers import check_password, make_password
      is_correct = False
      
      if db_password.startswith('pbkdf2_') or db_password.startswith('bcrypt') or db_password.startswith('argon2'):
        is_correct = check_password(password, db_password)
      else:
        is_correct = (password == db_password)
        if is_correct:
          hashed = make_password(password)
          with connection.cursor() as cursor:
            cursor.execute("UPDATE mutu_users SET password = %s WHERE id = %s", [hashed, user_data['id']])
            
      if is_correct:
        user_data.pop('password', None)
        res = {
          "status": {
              "success": True,
              "code": 200,
              "message": "Login successful",
          },
          "data": [user_data]
        }
        return JsonResponse(res, safe=False)

    return JsonResponse({
      "status": {
          "success": False,
          "code": 400,
          "message": "Login failed",
      },
      "data": {
        "id": None,
        "username": None,
        "password": None,
        "role": None,
      }
    })
  
@csrf_exempt
def getPermissions(request):
  with connection.cursor() as cursor:
    cursor.execute("SELECT role, feature FROM mutu_permissions")
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
def updatePermissions(request):
  if request.method == 'POST':
    data = json.loads(request.body)
    role = data.get('role')
    features = data.get('features', [])

    if not role:
      return JsonResponse({'status': False, 'message': 'Missing role parameter'}, status=400)

    with connection.cursor() as cursor:
      cursor.execute("DELETE FROM mutu_permissions WHERE role = %s", [role])
      if features:
        inserts = [(role, f) for f in features]
        cursor.executemany("INSERT INTO mutu_permissions (role, feature) VALUES (%s, %s)", inserts)

    return JsonResponse({'status': True, 'message': 'Permissions updated successfully'})
  return JsonResponse({'status': False, 'message': 'Method not allowed'}, status=405)

def getListKronologi(request):
  with connection.cursor() as cursor:
    no_transaksi = request.GET.get('no_transaksi', None)
    if no_transaksi is not None:
      query = "SELECT * FROM mutu_kronologi_kejadian WHERE no_transaksi = %s"
      cursor.execute(query, [no_transaksi])
      rows = dictfetchall(cursor)

      res = {
        "status": {
            "success": True,
            "code": 200,
            "message": "Request list kronologi successful",
        },
        "data": rows
      }
      return JsonResponse(res, safe=False)

  return JsonResponse({"status": False, "message": "Missing transaction number"})

@csrf_exempt
def verifikasiKronologi(request):
  if request.method == 'POST':
    data = json.loads(request.body)
    print('data verifikasi:', data)
    no_transaksi = data.get('no_transaksi')
    oleh = data.get('oleh')
    keterangan = data.get('keterangan', '')
    status = data.get('status', 0)

    with connection.cursor() as cursor:
      # cek exist
      query = "SELECT * FROM mutu_verifikasi WHERE no_transaksi = %s"
      cursor.execute(query, [no_transaksi])
      rows = dictfetchall(cursor)

      if len(rows) > 0:
        # update
        query = """
        UPDATE mutu_verifikasi SET oleh = %s, keterangan = %s, status = %s 
        OUTPUT inserted.id_verifikasi, inserted.no_transaksi, inserted.oleh, inserted.keterangan, inserted.status WHERE no_transaksi = %s"""
        cursor.execute(query, [json.dumps(oleh), keterangan, status, no_transaksi])
        rows = dictfetchall(cursor)
      else:
        # insert and output inserted row
        query = """
        INSERT INTO mutu_verifikasi (no_transaksi, oleh, keterangan, status)
        OUTPUT inserted.id_verifikasi, inserted.no_transaksi, inserted.oleh
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, [no_transaksi, json.dumps(oleh), keterangan, status])
        rows = dictfetchall(cursor)

      # Trigger WA notification to original reporter
      try:
        cursor.execute("SELECT nama_pasien, dibuat_oleh FROM mutu_kronologi_kejadian WHERE no_transaksi = %s", [no_transaksi])
        kron_rows = dictfetchall(cursor)
        
        if kron_rows:
          kron = kron_rows[0]
          nama_pasien = kron['nama_pasien']
          creator = json.loads(kron['dibuat_oleh'])
          creator_id = creator.get('id')
          creator_name = creator.get('username')
          
          telp = None
          cursor.execute("SELECT telp FROM mutu_users WHERE username = %s", [creator_name])
          mu_rows = dictfetchall(cursor)
          if mu_rows and mu_rows[0].get('telp'):
            telp = mu_rows[0]['telp']
          else:
            cursor.execute("SELECT FMKTELP FROM KARYAWAN WHERE FMKKARYAWAN_ID = %s OR FMKKARYAWANN = %s", [creator_id, creator_name])
            kar_rows = dictfetchall(cursor)
            if kar_rows and kar_rows[0].get('FMKTELP'):
              telp = kar_rows[0]['FMKTELP']
          
          if telp:
            status_text = "Disetujui/Diverifikasi" if status == 1 else "Ditolak/Perlu Revisi"
            msg = f"Halo {creator_name},\n\nLaporan kronologi insiden Anda untuk pasien {nama_pasien} (No. Trans: {no_transaksi}) telah selesai diverifikasi oleh Komite Mutu.\n\nStatus: {status_text}\nKeterangan: {keterangan}\n\nTerima kasih atas partisipasi Anda dalam menjaga keselamatan pasien."
            send_wa_notification(telp, msg)
      except Exception as e:
        print(f"Error triggering WA notification for verifikasiKronologi: {e}")

      res = {
        "status": {
            "success": True,
            "code": 200,
            "message": "Verifikasi kronologi sukses",
        },
        "data": rows
      }
      return JsonResponse(res, safe=False)