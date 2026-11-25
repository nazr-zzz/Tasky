-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 25, 2026 at 01:29 PM
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
-- Table structure for table `task`
--

CREATE TABLE `task` (
  `TASK_ID` varchar(36) NOT NULL,
  `KELAS_ID` varchar(36) NOT NULL,
  `DIUBAH_OLEH` varchar(36) DEFAULT NULL,
  `DIBUAT_OLEH` varchar(36) NOT NULL,
  `JUDUL_TUGAS` varchar(150) NOT NULL,
  `MATA_KULIAH` varchar(100) NOT NULL,
  `DEADLINE` timestamp NOT NULL DEFAULT current_timestamp(),
  `DESKRIPSI` text DEFAULT NULL,
  `UPDATED_AT` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task`
--

INSERT INTO `task` (`TASK_ID`, `KELAS_ID`, `DIUBAH_OLEH`, `DIBUAT_OLEH`, `JUDUL_TUGAS`, `MATA_KULIAH`, `DEADLINE`, `DESKRIPSI`, `UPDATED_AT`) VALUES
('9e6f770f-066c-4ad4-9b11-f391eabaec33', '82125440-17ea-4ee7-9fc5-13ecd90e86a2', NULL, 'eaea336f-adf6-457b-9202-01732ff2722d', 'Tampilan High Fidelity', 'UIUX', '2026-11-21 16:46:18', 'Buatlah tampilan High Fidelity pada aplikasi luandry', '2026-11-18 23:46:19'),
('t2', 'k1', NULL, 'u1', 'Membuat Laporan Mobile', 'Pemrograman Mobile', '2026-10-20 16:59:00', 'Menyelesaikan modul backend dan frontend', '2026-10-15 04:26:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `task`
--
ALTER TABLE `task`
  ADD PRIMARY KEY (`TASK_ID`),
  ADD KEY `FK_TASK_MEMBUAT_T_USER` (`DIBUAT_OLEH`),
  ADD KEY `FK_TASK_MENAMPUNG_KELAS` (`KELAS_ID`),
  ADD KEY `FK_TASK_MENGUBAH__USER` (`DIUBAH_OLEH`);

--
-- Constraints for dumped tables
--

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
