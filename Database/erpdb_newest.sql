-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: erpdb
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `diagnostics`
--

DROP TABLE IF EXISTS `diagnostics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diagnostics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipientId` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `specialist` varchar(255) DEFAULT NULL,
  `result` text,
  `status` enum('planned','done') DEFAULT 'planned',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `time` varchar(10) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'diagnostic',
  PRIMARY KEY (`id`),
  KEY `idx_diagnostics_recipientId` (`recipientId`),
  CONSTRAINT `diagnostics_ibfk_1` FOREIGN KEY (`recipientId`) REFERENCES `recipients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diagnostics`
--

LOCK TABLES `diagnostics` WRITE;
/*!40000 ALTER TABLE `diagnostics` DISABLE KEYS */;
/*!40000 ALTER TABLE `diagnostics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `size` int DEFAULT NULL,
  `recipientId` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `fullName` varchar(255) NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `contacts` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `direction` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (7,12,'ADMIN123',NULL,NULL,NULL,NULL,'2026-03-30 13:43:08','2026-03-30 13:43:08'),(8,13,'Препод Кураторич',NULL,NULL,NULL,NULL,'2026-03-31 14:19:58','2026-03-31 14:19:58');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `direction` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `curatorId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `curatorId` (`curatorId`),
  CONSTRAINT `fk_groups_curator` FOREIGN KEY (`curatorId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`curatorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (3,'Первая группа','Лечение чего то там','2026-04-14 13:22:44.000000','2026-04-23 14:04:58.000000',13);
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programs`
--

DROP TABLE IF EXISTS `programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `totalHours` int DEFAULT NULL,
  `totalWeeks` int DEFAULT NULL,
  `subjects` text,
  `metrics` text,
  `progress` int DEFAULT '0',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programs`
--

LOCK TABLES `programs` WRITE;
/*!40000 ALTER TABLE `programs` DISABLE KEYS */;
/*!40000 ALTER TABLE `programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipients`
--

DROP TABLE IF EXISTS `recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `fullName` varchar(255) NOT NULL,
  `age` int DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `program` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'active',
  `enrollmentDate` date DEFAULT NULL,
  `groupName` varchar(255) DEFAULT NULL,
  `legalRepresentative` varchar(255) DEFAULT NULL,
  `contacts` varchar(255) DEFAULT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `diagnosis` varchar(255) DEFAULT NULL,
  `curator` varchar(255) DEFAULT NULL,
  `attendance` int DEFAULT '0',
  `commScore` int DEFAULT '0',
  `groupScore` int DEFAULT '0',
  `creativityScore` int DEFAULT '0',
  `selfScore` int DEFAULT '0',
  `createdAt` datetime(6) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  `groupId` int DEFAULT NULL,
  `aggressionLevel` int DEFAULT '1',
  `showAggression` tinyint(1) DEFAULT '1',
  `aggressionNote` varchar(255) DEFAULT NULL,
  `completionStatus` enum('in_progress','completed') DEFAULT 'in_progress',
  `curatorId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_recipients_userId` (`userId`),
  KEY `idx_recipients_fullName` (`fullName`(191)),
  KEY `idx_recipients_groupId` (`groupId`),
  KEY `Recipients_curatorId_foreign_idx` (`curatorId`),
  CONSTRAINT `fk_recipients_group` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`) ON DELETE SET NULL,
  CONSTRAINT `Recipients_curatorId_foreign_idx` FOREIGN KEY (`curatorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recipients_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `recipients_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `recipients_ibfk_3` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipients`
--

LOCK TABLES `recipients` WRITE;
/*!40000 ALTER TABLE `recipients` DISABLE KEYS */;
INSERT INTO `recipients` VALUES (6,NULL,'https://avatars.mds.yandex.net/i?id=55cc0c87a39904eeb6c1ab875ec8f740c9bd59f0-4080417-images-thumbs&n=13','Мария',12,NULL,NULL,'active',NULL,'Нет',NULL,NULL,0,'Аутизм','Нет',0,0,0,0,0,'2026-03-31 13:41:38.000000','2026-05-05 14:34:15.015000',3,3,1,'С характером\n','completed',NULL),(7,NULL,'https://ticketscloud.com/s3/production/image/2023-07/64b9afe9c9f10e633f88efc3.png','Марат',12,NULL,NULL,'active',NULL,'123',NULL,NULL,0,'Даунизм','123',0,0,0,0,0,'2026-03-31 13:49:26.000000','2026-05-05 14:34:05.738000',3,1,1,'Обычное поведение','in_progress',NULL),(8,NULL,'https://i.ytimg.com/vi/GtLQPExx5y0/maxresdefault.jpg','Биба',7,NULL,NULL,'active',NULL,NULL,'Атэц','84785721221',0,'рас',NULL,0,0,0,0,0,'2026-05-03 18:54:45.000000','2026-05-05 14:49:37.775000',3,5,1,'Дерется\n','completed',NULL);
/*!40000 ALTER TABLE `recipients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timelineevents`
--

DROP TABLE IF EXISTS `timelineevents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timelineevents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `date` date DEFAULT NULL,
  `time` varchar(10) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `recipientId` int DEFAULT NULL,
  `groupId` int DEFAULT NULL,
  `specialist` varchar(255) DEFAULT NULL,
  `status` enum('planned','done') DEFAULT 'planned',
  PRIMARY KEY (`id`),
  KEY `idx_timeline_recipientId` (`recipientId`),
  KEY `idx_timeline_groupId` (`groupId`),
  CONSTRAINT `fk_timeline_group` FOREIGN KEY (`groupId`) REFERENCES `groups` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_timeline_recipient` FOREIGN KEY (`recipientId`) REFERENCES `recipients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timelineevents`
--

LOCK TABLES `timelineevents` WRITE;
/*!40000 ALTER TABLE `timelineevents` DISABLE KEYS */;
INSERT INTO `timelineevents` VALUES (8,'12312412','2026-05-06','16:59','meeting','2026-05-06 13:56:47','2026-05-06 13:56:47',7,NULL,'Препод Кураторич','done');
/*!40000 ALTER TABLE `timelineevents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `role` enum('admin','teacher','employee','recipient') DEFAULT 'recipient',
  `createdAt` datetime(6) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (12,'ADMIN123@erp.ru','$2b$10$y4Iw6RlzDDpmhB/ZwtcpW.qr4axTBAdUvXpwqtrfkOtFQIoIuzwJ2','Администратор Системы','admin','2026-03-30 13:43:08.000000','2026-03-31 14:18:41.000000'),(13,'teacher@erp.ru','$2b$10$CfTVMxhyTItu2BHkO1BALOZkvzVvJfyPkXZ/RIJ3TENXtgT4uDFsS','Препод Кураторич','teacher','2026-03-31 14:19:58.000000','2026-03-31 14:19:58.000000');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-12 11:37:56
