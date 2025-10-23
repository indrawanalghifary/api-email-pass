# Gunakan image dasar Python resmi
FROM python:3.9-slim-buster

# Tetapkan direktori kerja di dalam container
WORKDIR /app

# Salin file requirements.txt dan instal dependensi
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Salin sisa kode aplikasi ke dalam container
COPY . .

# Ekspos port yang akan digunakan aplikasi
EXPOSE 8000

# Perintah untuk menjalankan aplikasi menggunakan Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]