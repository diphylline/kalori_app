-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 24, 2025 at 02:13 PM
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
-- Database: `kalori_app_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `makanan`
--

CREATE TABLE `makanan` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `kalori` int(11) NOT NULL,
  `waktu` varchar(50) NOT NULL,
  `tanggal_dibuat` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `makanan`
--

INSERT INTO `makanan` (`id`, `user_id`, `nama`, `kalori`, `waktu`, `tanggal_dibuat`) VALUES
(10, 1, 'Chicken Thigh', 247, 'sarapan', '2025-06-24 12:08:39');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `target_kalori` int(11) DEFAULT 2000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `target_kalori`, `created_at`) VALUES
(1, 'dypta', 'dyptapratama3@gmail.com', '$2b$10$75IFcFmByZocoDFQEf3/1Oe83.u03ulmPVsTknj/LJHUsJuutqKHW', 2116, '2025-06-16 04:18:36'),
(2, 'admin', 'admin@example.com', '$2b$10$N3wh/p7LaQHRtHvz2.Gix.MM05gQAKKuXgW0Qerf7lE7kzKUoBhoa', 2197, '2025-06-16 04:32:55'),
(3, 'test', 'admin@gmail.com', '$2b$10$Z/UrGZ2mbbB5PH5KyEiLZOgJKFF2cOfG.o5k5YqhtRxvKplhVCR7W', 2000, '2025-06-24 11:54:33');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `makanan`
--
ALTER TABLE `makanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_makanan_users` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_UNIQUE` (`email`),
  ADD UNIQUE KEY `username_UNIQUE` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `makanan`
--
ALTER TABLE `makanan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `makanan`
--
ALTER TABLE `makanan`
  ADD CONSTRAINT `fk_makanan_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
