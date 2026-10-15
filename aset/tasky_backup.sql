-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 15, 2026 at 02:01 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_tasky`
--

-- --------------------------------------------------------

--
-- Table structure for table `anggota_kelas`
--

CREATE TABLE `anggota_kelas` (
  `ANGGOTA_ID` varchar(36) NOT NULL,
  `USER_ID` varchar(36) NOT NULL,
  `KELAS_ID` varchar(36) NOT NULL,
  `PERAN` varchar(20) NOT NULL, -- peran : 'PJMK', 'wakil PJMK', 'anggota'
  `JOINED_AT` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `catatan`
--

CREATE TABLE `catatan` (
  `CATATAN_ID` varchar(36) NOT NULL,
  `KELAS_ID` varchar(36) DEFAULT NULL,
  `USER_ID` varchar(36) NOT NULL,
  `MATA_KULIAH` varchar(100) NOT NULL,
  `ISI` text NOT NULL,
  `UPDATED_AT` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kelas`
--

CREATE TABLE `kelas` (
  `KELAS_ID` varchar(36) NOT NULL,
  `DIBUAT_OLEH` varchar(36) NOT NULL,
  `NAMA_KELAS` varchar(50) NOT NULL,
  `KODE_KELAS` varchar(10) NOT NULL,
  `CREATED_AT` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kelas`
--

INSERT INTO `kelas` (`KELAS_ID`, `DIBUAT_OLEH`, `NAMA_KELAS`, `KODE_KELAS`, `CREATED_AT`) VALUES
('k1', 'u1', 'pemmob', 'M01', '2026-09-16 17:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `NOTIF_ID` varchar(36) NOT NULL,
  `TASK_ID` varchar(36) DEFAULT NULL,
  `USER_ID` varchar(36) NOT NULL,
  `JENIS` varchar(20) NOT NULL,
  `PESAN` varchar(255) NOT NULL,
  `WAKTU_KIRIM` timestamp NOT NULL DEFAULT current_timestamp(),
  `IS_READ` smallint(6) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `status_tugas`
--

CREATE TABLE `status_tugas` (
  `STATUS_ID` varchar(36) NOT NULL,
  `TASK_ID` varchar(36) NOT NULL,
  `USER_ID` varchar(36) NOT NULL,
  `STATUS` varchar(20) NOT NULL, -- status : 'belum dikerjakan', 'selesai'
  `UPDATED_AT` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task`
--

CREATE TABLE `task` (
  `TASK_ID` varchar(36) NOT NULL,
  `KELAS_ID` varchar(36) NOT NULL,
  `DIUBAH_OLEH` varchar(36) DEFAULT NULL,
  `DIBUAT_OLEH` varchar(36) NOT NULL,
  `JUDUL_TUGAS` varchar(150) NOT NULL,
  `MATA_KULIAH` varchar(100) NOT NULL,
  `DEADLINE` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `DESKRIPSI` text DEFAULT NULL,
  `UPDATED_AT` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task`
--

INSERT INTO `task` (`TASK_ID`, `KELAS_ID`, `DIUBAH_OLEH`, `DIBUAT_OLEH`, `JUDUL_TUGAS`, `MATA_KULIAH`, `DEADLINE`, `DESKRIPSI`, `UPDATED_AT`) VALUES
('t2', 'k1', NULL, 'u1', 'Membuat Laporan Mobile', 'Pemrograman Mobile', '2026-10-20 16:59:00', 'Menyelesaikan modul backend dan frontend', '2026-10-15 04:26:09');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `USER_ID` varchar(36) NOT NULL,
  `NAMA` varchar(100) NOT NULL,
  `NIM` varchar(20) NOT NULL,
  `EMAIL` varchar(100) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `CREATED_AT` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`USER_ID`, `NAMA`, `NIM`, `EMAIL`, `PASSWORD`, `CREATED_AT`) VALUES
('u1', 'moana', '081', 'mon@gmail.com', 'mon123', '2025-12-31 17:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `anggota_kelas`
--
ALTER TABLE `anggota_kelas`
  ADD PRIMARY KEY (`ANGGOTA_ID`),
  ADD KEY `FK_ANGGOTA__MEMILIKI__KELAS` (`KELAS_ID`),
  ADD KEY `FK_ANGGOTA__TERDAFTAR_USER` (`USER_ID`);

--
-- Indexes for table `catatan`
--
ALTER TABLE `catatan`
  ADD PRIMARY KEY (`CATATAN_ID`),
  ADD KEY `FK_CATATAN_CATATAN_K_KELAS` (`KELAS_ID`),
  ADD KEY `FK_CATATAN_MENULIS_C_USER` (`USER_ID`);

--
-- Indexes for table `kelas`
--
ALTER TABLE `kelas`
  ADD PRIMARY KEY (`KELAS_ID`),
  ADD KEY `FK_KELAS_MEMBUAT_K_USER` (`DIBUAT_OLEH`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`NOTIF_ID`),
  ADD KEY `FK_NOTIFICA_EVENT_PEM_TASK` (`TASK_ID`),
  ADD KEY `FK_NOTIFICA_MENERIMA__USER` (`USER_ID`);

--
-- Indexes for table `status_tugas`
--
ALTER TABLE `status_tugas`
  ADD PRIMARY KEY (`STATUS_ID`),
  ADD KEY `FK_STATUS_T_PROGRES_P_USER` (`USER_ID`),
  ADD KEY `FK_STATUS_T_STATUS_PE_TASK` (`TASK_ID`);

--
-- Indexes for table `task`
--
ALTER TABLE `task`
  ADD PRIMARY KEY (`TASK_ID`),
  ADD KEY `FK_TASK_MEMBUAT_T_USER` (`DIBUAT_OLEH`),
  ADD KEY `FK_TASK_MENAMPUNG_KELAS` (`KELAS_ID`),
  ADD KEY `FK_TASK_MENGUBAH__USER` (`DIUBAH_OLEH`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`USER_ID`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `anggota_kelas`
--
ALTER TABLE `anggota_kelas`
  ADD CONSTRAINT `FK_ANGGOTA__MEMILIKI__KELAS` FOREIGN KEY (`KELAS_ID`) REFERENCES `kelas` (`KELAS_ID`),
  ADD CONSTRAINT `FK_ANGGOTA__TERDAFTAR_USER` FOREIGN KEY (`USER_ID`) REFERENCES `user` (`USER_ID`);

--
-- Constraints for table `catatan`
--
ALTER TABLE `catatan`
  ADD CONSTRAINT `FK_CATATAN_CATATAN_K_KELAS` FOREIGN KEY (`KELAS_ID`) REFERENCES `kelas` (`KELAS_ID`),
  ADD CONSTRAINT `FK_CATATAN_MENULIS_C_USER` FOREIGN KEY (`USER_ID`) REFERENCES `user` (`USER_ID`);

--
-- Constraints for table `kelas`
--
ALTER TABLE `kelas`
  ADD CONSTRAINT `FK_KELAS_MEMBUAT_K_USER` FOREIGN KEY (`DIBUAT_OLEH`) REFERENCES `user` (`USER_ID`);

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `FK_NOTIFICA_EVENT_PEM_TASK` FOREIGN KEY (`TASK_ID`) REFERENCES `task` (`TASK_ID`),
  ADD CONSTRAINT `FK_NOTIFICA_MENERIMA__USER` FOREIGN KEY (`USER_ID`) REFERENCES `user` (`USER_ID`);

--
-- Constraints for table `status_tugas`
--
ALTER TABLE `status_tugas`
  ADD CONSTRAINT `FK_STATUS_T_PROGRES_P_USER` FOREIGN KEY (`USER_ID`) REFERENCES `user` (`USER_ID`),
  ADD CONSTRAINT `FK_STATUS_T_STATUS_PE_TASK` FOREIGN KEY (`TASK_ID`) REFERENCES `task` (`TASK_ID`);

--
-- Constraints for table `task`
--
ALTER TABLE `task`
  ADD CONSTRAINT `FK_TASK_MEMBUAT_T_USER` FOREIGN KEY (`DIBUAT_OLEH`) REFERENCES `user` (`USER_ID`),
  ADD CONSTRAINT `FK_TASK_MENAMPUNG_KELAS` FOREIGN KEY (`KELAS_ID`) REFERENCES `kelas` (`KELAS_ID`),
  ADD CONSTRAINT `FK_TASK_MENGUBAH__USER` FOREIGN KEY (`DIUBAH_OLEH`) REFERENCES `user` (`USER_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
