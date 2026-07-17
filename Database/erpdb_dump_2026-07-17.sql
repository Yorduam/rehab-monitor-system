-- MySQL dump 10.13  Distrib 9.7.0, for Win64 (x86_64)
--
-- Host: localhost    Database: erpdb
-- ------------------------------------------------------
-- Server version	9.7.0

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '1b49fe35-5378-11f1-a97d-74563c652715:1-372';

--
-- Current Database: `erpdb`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `erpdb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `erpdb`;

--
-- Table structure for table `crg`
--

DROP TABLE IF EXISTS `crg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crg` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL,
  `child` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crg`
--

LOCK TABLES `crg` WRITE;
/*!40000 ALTER TABLE `crg` DISABLE KEYS */;
INSERT INTO `crg` VALUES (1,'Инвалиды с преимущественными нарушениями психических функций','ЦРГ 1',0),(2,'Инвалиды с преимущественными нарушениями языковых и речевых функций','ЦРГ 2',0),(3,'Инвалиды с преимущественными нарушениями сенсорных функций','ЦРГ 3',0),(4,'Инвалиды с преимущественными нарушениями нейромышечных, скелетных и связанных с движением (статодинамических) функций','ЦРГ 4',0),(5,'Инвалиды с преимущественными нарушениями функций сердечно-сосудистой и (или) дыхательной системы (систем)','ЦРГ 5',0),(6,'Инвалиды с преимущественными нарушениями функций пищеварительной и (или) эндокринной системы (систем) и метаболизма','ЦРГ 6',0),(7,'Инвалиды с преимущественными нарушениями функций системы крови и иммунной системы, в том числе вследствие злокачественных новообразований, а также отдельных инфекционных заболеваний','ЦРГ 7',0),(8,'Инвалиды с преимущественными нарушениями мочевыделительной функции','ЦРГ 8',0),(9,'Инвалиды с преимущественными нарушениями функций кожи и связанных с ней систем','ЦРГ 9',0),(10,'Инвалиды со сложными и (или) множественными нарушениями функций организма, обусловленными хромосомными и генными болезнями','ЦРГ 10',0),(11,'Инвалиды с врожденными или приобретенными деформациями (аномалиями развития), последствиями травм лица','ЦРГ 11',0),(12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях','ЦРГ 12',0),(13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями','ЦРГ 13',0),(14,'Ребенок-инвалид с преимущественными нарушениями психических функций','ЦРГ 1',1),(15,'Ребенок-инвалид с преимущественными нарушениями языковых и речевых функций','ЦРГ 2',1),(16,'Ребенок-инвалид с преимущественными нарушениями сенсорных функций','ЦРГ 3',1),(17,'Ребенок-инвалид с преимущественными нарушениями нейромышечных, скелетных и связанных с движением (статодинамических) функций','ЦРГ 4',1),(18,'Ребенок-инвалид с преимущественными нарушениями функций сердечно-сосудистой и (или) дыхательной системы (систем)','ЦРГ 5',1),(19,'Ребенок-инвалид с преимущественными нарушениями функций пищеварительной и (или) эндокринной системы (систем) и метаболизма','ЦРГ 6',1),(20,'Ребенок-инвалид с преимущественными нарушениями функций системы крови и иммунной системы, в том числе вследствие злокачественных новообразований, а также отдельных инфекционных заболеваний','ЦРГ 7',1),(21,'Ребенок-инвалид с преимущественными нарушениями мочевыделительной функции','ЦРГ 8',1),(22,'Ребенок-инвалид с преимущественными нарушениями функций кожи и связанных с ней систем','ЦРГ 9',1),(23,'Ребенок-инвалид со сложными и (или) множественными нарушениями функций организма, обусловленными хромосомными и генными болезнями','ЦРГ 10',1),(24,'Ребенок-инвалид с врожденными или приобретенными деформациями (аномалиями развития), последствиями травм лица','ЦРГ 11',1),(25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями','ЦРГ 12',1);
/*!40000 ALTER TABLE `crg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crgdesc`
--

DROP TABLE IF EXISTS `crgdesc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crgdesc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoryId` int NOT NULL,
  `name` varchar(265) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `code` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `crgdesc_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `crg` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=194 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crgdesc`
--

LOCK TABLES `crgdesc` WRITE;
/*!40000 ALTER TABLE `crgdesc` DISABLE KEYS */;
INSERT INTO `crgdesc` VALUES (1,1,'Инвалиды вследствие нарушений интеллектуального развития','ЦРГ 1.1'),(2,1,'Инвалиды вследствие расстройств аутистического спектра','ЦРГ 1.2'),(3,1,'Инвалиды вследствие экзогенно-органических расстройств, а также эпизодических и пароксизмальных расстройств','ЦРГ 1.3'),(4,1,'Инвалиды вследствие эндогенных, аффективных, невротических и соматоформных расстройств','ЦРГ 1.4'),(131,3,'Инвалиды вследствие слепоты или слабовидения','ЦРГ 3.1'),(132,3,'Инвалиды вследствие глухоты или слабослышания','ЦРГ 3.2'),(133,3,'Инвалиды вследствие сочетанных нарушений функций зрения и слуха','ЦРГ 3.3'),(134,4,'Инвалиды вследствие церебрального паралича и других заболеваний, аномалий (пороков развития) центральной и периферической нервной системы, последствий травм периферической нервной системы, головного мозга и острых нарушений мозгового кровообращения','ЦРГ 4.1'),(135,4,'Инвалиды вследствие заболеваний костно-мышечной системы, а также последствий травм и аномалий (пороков развития), деформаций опорно-двигательного аппарата','ЦРГ 4.2'),(136,4,'Инвалиды вследствие врожденного или приобретенного отсутствия одной верхней конечности','ЦРГ 4.3'),(137,4,'Инвалиды вследствие врожденного или приобретенного отсутствия обеих верхних конечностей','ЦРГ 4.4'),(138,4,'Инвалиды вследствие врожденного или приобретенного отсутствия одной нижней конечности','ЦРГ 4.5'),(139,4,'Инвалиды вследствие врожденного или приобретенного отсутствия обеих нижних конечностей','ЦРГ 4.6'),(140,4,'Инвалиды вследствие спинальной травмы и связанных с ней повреждений спинного мозга','ЦРГ 4.7'),(141,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, вследствие приобретенного отсутствия (ампутации) одной верхней конечности','ЦРГ 12.1'),(142,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, вследствие приобретенного отсутствия (ампутации) обеих верхних конечностей','ЦРГ 12.2'),(143,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, вследствие приобретенного отсутствия (ампутации) одной нижней конечности','ЦРГ 12.3'),(144,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, вследствие приобретенного отсутствия (ампутации) обеих нижних конечностей','ЦРГ 12.4'),(145,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями травм, термических и химических ожогов, отморожений конечностей с формированием анкилозов, контрактур и стягивающих рубцов','ЦРГ 12.5'),(146,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями спинальной травмы и связанных с ней повреждений спинного мозга','ЦРГ 12.6'),(147,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения периферической нервной системы','ЦРГ 12.7'),(148,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения мозгового отдела черепа и головного мозга','ЦРГ 12.8'),(149,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения лицевого отдела черепа, в том числе с одновременным нарушением функций жевания, глотания, голосообразования, зрения или слуха','ЦРГ 12.9'),(150,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения органа зрения','ЦРГ 12.10'),(151,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения органа слуха','ЦРГ 12.11'),(152,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями поражения внутренних органов, в том числе с аномальными отверстиями пищеварительного, мочевыделительного, дыхательного трактов','ЦРГ 12.12'),(153,12,'Инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, с последствиями множественных ранений или комбинированной травмы с одновременными нарушениями различных функций организма человека','ЦРГ 12.13'),(154,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) одной верхней конечности','ЦРГ 13.1'),(155,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) обеих верхних конечностей','ЦРГ 13.2'),(156,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) одной нижней конечности','ЦРГ 13.3'),(157,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия обеих нижних конечностей','ЦРГ 13.4'),(158,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие травм, термических и химических ожогов, отморожений конечностей с формированием анкилозов, контрактур и стягивающих рубцов','ЦРГ 13.5'),(159,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие спинальной травмы и связанных с ней повреждений спинного мозга','ЦРГ 13.6'),(160,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения периферической нервной системы','ЦРГ 13.7'),(161,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения мозгового отдела черепа и головного мозга','ЦРГ 13.8'),(162,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения лицевого отдела черепа, в том числе с одновременным нарушением функций жевания, глотания, голосообразования, зрения или слуха','ЦРГ 13.9'),(163,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения органа зрения','ЦРГ 13.10'),(164,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения органа слуха','ЦРГ 13.11'),(165,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения внутренних органов, в том числе с аномальными отверстиями пищеварительного, мочевыделительного, дыхательного трактов','ЦРГ 13.12'),(166,13,'Инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие комбинированной травмы или множественных ранений с одновременными нарушениями различных функций организма человека','ЦРГ 13.13'),(167,14,'Ребенок-инвалид вследствие нарушений интеллектуального развития и расстройств развития учебных навыков','ЦРГ 1.1'),(168,14,'Ребенок-инвалид вследствие расстройств аутистического спектра','ЦРГ 1.2'),(169,14,'Ребенок-инвалид вследствие экзогенно-органических расстройств, а также эпизодических и пароксизмальных расстройств','ЦРГ 1.3'),(170,14,'Ребенок-инвалид вследствие эндогенных, аффективных, невротических и соматоформных расстройств','ЦРГ 1.4'),(171,16,'Ребенок-инвалид вследствие слепоты или слабовидения','ЦРГ 3.1'),(172,16,'Ребенок-инвалид вследствие глухоты или слабослышания','ЦРГ 3.2'),(173,16,'Ребенок-инвалид вследствие сочетанных нарушений функций зрения и слуха','ЦРГ 3.3'),(174,17,'Ребенок-инвалид вследствие церебрального паралича и других заболеваний, аномалий (пороков развития) центральной и периферической нервной системы, последствий травм периферической нервной системы, головного мозга и острых нарушений мозгового кровообращения','ЦРГ 4.1'),(175,17,'Ребенок-инвалид вследствие заболеваний костно-мышечной системы, а также последствий травм и аномалий (пороков развития), деформаций опорно-двигательного аппарата','ЦРГ 4.2'),(176,17,'Ребенок-инвалид вследствие врожденного или приобретенного отсутствия одной верхней конечности','ЦРГ 4.3'),(177,17,'Ребенок-инвалид вследствие врожденного или приобретенного отсутствия обеих верхних конечностей','ЦРГ 4.4'),(178,17,'Ребенок-инвалид вследствие врожденного или приобретенного отсутствия одной нижней конечности','ЦРГ 4.5'),(179,17,'Ребенок-инвалид вследствие врожденного или приобретенного отсутствия обеих нижних конечностей','ЦРГ 4.6'),(180,17,'Ребенок-инвалид вследствие шейной или спинальной травмы и связанных с ней повреждений спинного мозга','ЦРГ 4.7'),(181,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) одной верхней конечности','ЦРГ 12.1'),(182,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) обеих верхних конечностей','ЦРГ 12.2'),(183,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) одной нижней конечности','ЦРГ 12.3'),(184,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие приобретенного отсутствия (ампутации) обеих нижних конечностей','ЦРГ 12.4'),(185,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие травм, термических и химических ожогов, отморожений конечностей с формированием анкилозов, контрактур и стягивающих рубцов','ЦРГ 12.5'),(186,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие спинальной травмы и связанных с ней повреждений спинного мозга','ЦРГ 12.6'),(187,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения периферической нервной системы','ЦРГ 12.7'),(188,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения мозгового отдела черепа и головного мозга','ЦРГ 12.8'),(189,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения лицевого отдела черепа, в том числе с одновременным нарушением функций жевания, глотания, голосообразования, зрения или слуха','ЦРГ 12.9'),(190,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения органа зрения','ЦРГ 12.10'),(191,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения органа слуха','ЦРГ 12.11'),(192,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие поражения внутренних органов, в том числе с аномальными отверстиями пищеварительного, мочевыделительного, дыхательного трактов','ЦРГ 12.12'),(193,25,'Ребенок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, вследствие комбинированной травмы или множественных ранений с одновременными нарушениями различных функций организма человека','ЦРГ 12.13');
/*!40000 ALTER TABLE `crgdesc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crgrecipientsec`
--

DROP TABLE IF EXISTS `crgrecipientsec`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crgrecipientsec` (
  `idRecipient` int NOT NULL,
  `idCRGDesc` int NOT NULL,
  PRIMARY KEY (`idRecipient`,`idCRGDesc`),
  KEY `idCRGDesc` (`idCRGDesc`),
  CONSTRAINT `crgrecipientsec_ibfk_1` FOREIGN KEY (`idRecipient`) REFERENCES `recipients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `crgrecipientsec_ibfk_2` FOREIGN KEY (`idCRGDesc`) REFERENCES `crgdesc` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crgrecipientsec`
--

LOCK TABLES `crgrecipientsec` WRITE;
/*!40000 ALTER TABLE `crgrecipientsec` DISABLE KEYS */;
/*!40000 ALTER TABLE `crgrecipientsec` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diagnosticassignments`
--

DROP TABLE IF EXISTS `diagnosticassignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diagnosticassignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` varchar(64) DEFAULT NULL,
  `recipientId` int NOT NULL,
  `directionId` int NOT NULL,
  `specialistUserId` int NOT NULL,
  `date` date NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `blockStatus` varchar(20) NOT NULL DEFAULT 'assigned',
  `results` json DEFAULT NULL,
  `comment` text,
  `completedAt` datetime DEFAULT NULL,
  `createdBy` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recipientId` (`recipientId`),
  KEY `directionId` (`directionId`),
  KEY `specialistUserId` (`specialistUserId`),
  CONSTRAINT `diagnosticassignments_ibfk_1` FOREIGN KEY (`recipientId`) REFERENCES `recipients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `diagnosticassignments_ibfk_2` FOREIGN KEY (`directionId`) REFERENCES `direction` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `diagnosticassignments_ibfk_3` FOREIGN KEY (`specialistUserId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diagnosticassignments`
--

LOCK TABLES `diagnosticassignments` WRITE;
/*!40000 ALTER TABLE `diagnosticassignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `diagnosticassignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `direction`
--

DROP TABLE IF EXISTS `direction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `direction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `profileKey` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `direction`
--

LOCK TABLES `direction` WRITE;
/*!40000 ALTER TABLE `direction` DISABLE KEYS */;
INSERT INTO `direction` VALUES (1,'Психологическая диагностика','psy'),(2,'Логопедическая диагностика','log'),(3,'Художественная диагностика (ИЗО)','izo'),(4,'Театральная диагностика','theatre'),(5,'Вокальная диагностика','vocal'),(6,'Адаптивная физкультура (АФК)','afk');
/*!40000 ALTER TABLE `direction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctype`
--

DROP TABLE IF EXISTS `doctype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(128) NOT NULL,
  `category` enum('scan','generated','signed') NOT NULL,
  `isRequired` tinyint(1) NOT NULL,
  `appliesTo` enum('rehabilitant','representative','both') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctype`
--

LOCK TABLES `doctype` WRITE;
/*!40000 ALTER TABLE `doctype` DISABLE KEYS */;
INSERT INTO `doctype` VALUES (12,'birth','Свидетельство о рождении / паспорт реабилитанта','scan',1,'rehabilitant'),(13,'rep-pass','Паспорт законного представителя','scan',1,'representative'),(14,'housing','ЕЖД / выписка из домовой книги / форма №8','scan',1,'rehabilitant'),(15,'mse','Справка МСЭ','scan',1,'rehabilitant'),(16,'ipra','ИПРА','scan',1,'rehabilitant'),(17,'cpmpk','Заключение ЦПМПК','scan',0,'rehabilitant'),(18,'med','Медицинская справка','scan',1,'rehabilitant'),(19,'snils','СНИЛС','scan',1,'rehabilitant'),(20,'signed-pdn','Подписанное согласие на обработку ПДн','signed',0,'representative'),(21,'signed-photo','Подписанное согласие на фото/видео','signed',0,'representative'),(22,'signed-diag','Подписанное заявление на диагностику','signed',0,'representative');
/*!40000 ALTER TABLE `doctype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `legalrepresentatives`
--

DROP TABLE IF EXISTS `legalrepresentatives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `legalrepresentatives` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstName` varchar(50) NOT NULL,
  `middleName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `passportSeries` char(4) NOT NULL,
  `passportNumber` char(6) NOT NULL,
  `passportIssuer` varchar(255) NOT NULL,
  `passportIssuerDate` date DEFAULT NULL,
  `passportDeptCode` char(7) NOT NULL,
  `passportReg` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `le_telephone` (`telephone`),
  UNIQUE KEY `le_email` (`email`),
  UNIQUE KEY `le_passport` (`passportSeries`,`passportNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `legalrepresentatives`
--

LOCK TABLES `legalrepresentatives` WRITE;
/*!40000 ALTER TABLE `legalrepresentatives` DISABLE KEYS */;
INSERT INTO `legalrepresentatives` VALUES (1,'Елена','Викторовна','Морозова','+79169876543','morozova.ev@example.com','4516','123456','ОВД района Хамовники г. Москвы','2015-06-20','770-001','г. Москва, ул. Льва Толстого, д. 16, кв. 5'),(9,'Ваня','ФЫВФЫВ','Иванов','+79883172371','lr-79883172371@intake.local','9012','123321','офлывлй','2001-10-10','300-122','йцшушщйц'),(10,'Андрей','','Алексеев','+7 (213) 123-21-31','lr-72131232131@intake.local','1232','423423','вйцворлфы','2010-12-12','435-876','щшйщшйащ'),(11,'Иван','Иванович','Иванов','+7 (925) 222-11-01','lr-79252221101@intake.local','1233','432151','Г.Москва','2005-01-20','902-389','Г.Лось , хибинский'),(12,'Вв','Вв','Вв','+7 (123) 421-32-13','lr-71234213213@intake.local','2132','123213','123213','2026-07-01','321-123','321321'),(13,'Дмитрий','Морозов','Алексеевич','+7 (930) 218-30-92','lr-79302183092@intake.local','4538','992319','ТЕСТ','2010-02-01','135-431','Г.МОСКВА');
/*!40000 ALTER TABLE `legalrepresentatives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nozology`
--

DROP TABLE IF EXISTS `nozology`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nozology` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nozology`
--

LOCK TABLES `nozology` WRITE;
/*!40000 ALTER TABLE `nozology` DISABLE KEYS */;
INSERT INTO `nozology` VALUES (1,'I','Некоторые инфекционные и паразитарные болезни','A00–B99'),(2,'II','Новообразования','C00–D48'),(3,'III','Болезни крови, кроветворных органов и отдельные нарушения, вовлекающие иммунный механизм','D50–D89'),(4,'IV','Болезни эндокринной системы, расстройства питания и нарушения обмена веществ','E00–E90'),(5,'V','Психические расстройства и расстройства поведения','F00–F99'),(6,'VI','Болезни нервной системы','G00–G99'),(7,'VII','Болезни глаза и его придаточного аппарата','H00–H59'),(8,'VIII','Некоторые инфекционные и паразитарные болезни','H60–H95'),(9,'IX','Болезни системы кровообращения','I00–I99'),(10,'X','Болезни органов дыхания','J00–J99'),(11,'XI','Болезни органов пищеварения','K00–K93'),(12,'XII','Болезни кожи и подкожной клетчатки','L00–L99'),(13,'XIII','Болезни костно-мышечной системы и соединительной ткани','M00–M99'),(14,'XIV','Болезни мочеполовой системы','N00–N99'),(15,'XV','Беременность, роды и послеродовой период','O00–O99'),(16,'XVI','Отдельные состояния, возникающие в перинатальном периоде','P00–P96'),(17,'XVII','Врождённые аномалии (пороки развития), деформации и хромосомные нарушения','Q00–Q99'),(18,'XVIII','Симптомы, признаки и отклонения от нормы, выявленные при клинических и лабораторных исследованиях, не классифицированные в других рубриках','R00–R99'),(19,'XIX','Травмы, отравления и некоторые другие последствия воздействия внешних причин','S00–T98'),(20,'XX','Внешние причины заболеваемости и смертности','V01–Y98'),(21,'XXI','Факторы, влияющие на состояние здоровья населения и обращения в учреждения здравоохранения','Z00–Z99');
/*!40000 ALTER TABLE `nozology` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipientdocs`
--

DROP TABLE IF EXISTS `recipientdocs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipientdocs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipientId` int NOT NULL,
  `docType` enum('Свидетельство','Паспорт') NOT NULL,
  `docSeries` varchar(16) NOT NULL,
  `docNumber` varchar(16) NOT NULL,
  `docIssuer` varchar(255) NOT NULL,
  `docIssuerDate` date NOT NULL,
  `snils` char(14) NOT NULL,
  `mseIssueDate` date NOT NULL,
  `mseValidDate` date NOT NULL,
  `regAddress` varchar(500) NOT NULL,
  `factAddress` varchar(500) NOT NULL,
  `factSameReg` tinyint(1) NOT NULL DEFAULT '0',
  `educationPlace` varchar(255) NOT NULL,
  `specialNote` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `re_snils` (`snils`),
  KEY `recipientId` (`recipientId`),
  CONSTRAINT `recipientdocs_ibfk_1` FOREIGN KEY (`recipientId`) REFERENCES `recipients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipientdocs`
--

LOCK TABLES `recipientdocs` WRITE;
/*!40000 ALTER TABLE `recipientdocs` DISABLE KEYS */;
INSERT INTO `recipientdocs` VALUES (5,10,'Паспорт','3123','423435','ДЖПТ ПО ГОРОДУ ШАНХАЙ','2009-05-20','039-812-904 89','2009-03-20','2029-03-20','Г.Москва . Лось','Г.Москва . Лось',1,'увауцкц',''),(6,11,'Паспорт','1232','123213','12312321321312321','2026-07-09','213-213-213 12','2026-07-01','2026-07-16','123ц','123ц',1,'вфывф','ыыыыыыыы'),(7,12,'Паспорт','2343','432432','вапав','2020-01-20','213-213-213 21','2015-01-02','2030-01-02','уцауц','уцауц',1,'аывавы','ывавы');
/*!40000 ALTER TABLE `recipientdocs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipients`
--

DROP TABLE IF EXISTS `recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `middleName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `birthDate` date DEFAULT NULL,
  `email` varchar(50) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  `photo` blob NOT NULL,
  `representativeId` int NOT NULL,
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'active',
  `disableGroup` enum('Ребенок-инвалид','I группа','II группа','III группа','Нет') NOT NULL DEFAULT 'Нет',
  `diagnosis` varchar(255) NOT NULL,
  `nozology` int NOT NULL,
  `groupId` int DEFAULT NULL,
  `CRGMain` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `re_telephone` (`telephone`),
  UNIQUE KEY `re_email` (`email`),
  KEY `nozology` (`nozology`),
  KEY `CRGMain` (`CRGMain`),
  KEY `groupId` (`groupId`),
  KEY `userId` (`userId`),
  KEY `representativeId` (`representativeId`),
  CONSTRAINT `recipients_ibfk_1` FOREIGN KEY (`nozology`) REFERENCES `nozology` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `recipients_ibfk_2` FOREIGN KEY (`CRGMain`) REFERENCES `crg` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `recipients_ibfk_3` FOREIGN KEY (`groupId`) REFERENCES `regroup` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `recipients_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `recipients_ibfk_5` FOREIGN KEY (`representativeId`) REFERENCES `legalrepresentatives` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipients`
--

LOCK TABLES `recipients` WRITE;
/*!40000 ALTER TABLE `recipients` DISABLE KEYS */;
INSERT INTO `recipients` VALUES (10,20,'Андрей','Андреевич','Алексеев','2000-02-20','rcp-03981290489@intake.local','+7 (925) 222-11-01','',11,'draft','Нет','Даун',2,NULL,1),(11,21,'Выфв','Вы','Ыфвыф','2000-02-10','rcp-21321321312@intake.local','+7 (123) 421-32-13',_binary 'data:image/jpeg;base64,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',12,'draft','Нет','ыфв',3,NULL,1),(12,22,'Анна','Федорова','Юрьевна','2009-01-20','rcp-21321321321@intake.local','+7 (930) 218-30-92','',13,'draft','Нет','аыацувы',1,NULL,1);
/*!40000 ALTER TABLE `recipients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipientscandocs`
--

DROP TABLE IF EXISTS `recipientscandocs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipientscandocs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entityType` enum('rehabilitant','representative') NOT NULL,
  `recipId` int NOT NULL,
  `represId` int NOT NULL,
  `docType` int NOT NULL,
  `storageKey` varchar(500) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `sizeBytes` bigint unsigned NOT NULL,
  `checksum_sha256` char(64) NOT NULL,
  `fileData` longblob,
  PRIMARY KEY (`id`),
  KEY `recipId` (`recipId`),
  KEY `represId` (`represId`),
  KEY `docType` (`docType`),
  CONSTRAINT `recipientscandocs_ibfk_1` FOREIGN KEY (`recipId`) REFERENCES `recipients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `recipientscandocs_ibfk_2` FOREIGN KEY (`represId`) REFERENCES `legalrepresentatives` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `recipientscandocs_ibfk_3` FOREIGN KEY (`docType`) REFERENCES `doctype` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipientscandocs`
--

LOCK TABLES `recipientscandocs` WRITE;
/*!40000 ALTER TABLE `recipientscandocs` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipientscandocs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regroup`
--

DROP TABLE IF EXISTS `regroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regroup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `groupName` varchar(50) NOT NULL,
  `curatorUserId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regroup`
--

LOCK TABLES `regroup` WRITE;
/*!40000 ALTER TABLE `regroup` DISABLE KEYS */;
INSERT INTO `regroup` VALUES (10,'Группа 2',19);
/*!40000 ALTER TABLE `regroup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reresults`
--

DROP TABLE IF EXISTS `reresults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reresults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idRecipient` int NOT NULL,
  `idDirection` int NOT NULL,
  `idSpecialist` int NOT NULL,
  `date` date NOT NULL,
  `results` json NOT NULL,
  `published` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idRecipient` (`idRecipient`),
  KEY `idSpecialist` (`idSpecialist`),
  KEY `idDirection` (`idDirection`),
  CONSTRAINT `reresults_ibfk_1` FOREIGN KEY (`idRecipient`) REFERENCES `recipients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `reresults_ibfk_3` FOREIGN KEY (`idDirection`) REFERENCES `direction` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reresults`
--

LOCK TABLES `reresults` WRITE;
/*!40000 ALTER TABLE `reresults` DISABLE KEYS */;
INSERT INTO `reresults` VALUES (11,12,1,19,'2026-07-17','{}',0);
/*!40000 ALTER TABLE `reresults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduleevents`
--

DROP TABLE IF EXISTS `scheduleevents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduleevents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `specialistUserId` int NOT NULL,
  `recipientId` int DEFAULT NULL,
  `directionId` int DEFAULT NULL,
  `assignmentId` int DEFAULT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'lesson',
  `title` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'scheduled',
  `createdBy` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL,
  `updatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `specialistUserId` (`specialistUserId`),
  KEY `recipientId` (`recipientId`),
  KEY `directionId` (`directionId`),
  KEY `assignmentId` (`assignmentId`),
  CONSTRAINT `scheduleevents_ibfk_1` FOREIGN KEY (`specialistUserId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `scheduleevents_ibfk_2` FOREIGN KEY (`recipientId`) REFERENCES `recipients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `scheduleevents_ibfk_3` FOREIGN KEY (`directionId`) REFERENCES `direction` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `scheduleevents_ibfk_4` FOREIGN KEY (`assignmentId`) REFERENCES `diagnosticassignments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduleevents`
--

LOCK TABLES `scheduleevents` WRITE;
/*!40000 ALTER TABLE `scheduleevents` DISABLE KEYS */;
/*!40000 ALTER TABLE `scheduleevents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(50) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('admin','teacher','employee','recipient') DEFAULT 'recipient',
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `directionId` int DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `cabinet` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'mininis@social.mos.ru','$2a$10$S9p.FzVcu2vEbrxSagsTGu6G6wwGIh5YieF3Rx0ZRAthKD8xKt23.','admin',NULL,NULL,NULL,NULL,NULL),(18,'soso@mail.ru','$2b$10$K360YkG6iqqHypcnYQqYnOKp7qZqiFaBdpkj036yUeQ0NkwVZZw/a','employee','Владимир','Карпов',NULL,'+79773331122','101'),(19,'qwerty@mail.ru','$2b$10$Xa1sKm3ciApOzjZFgsBsh.zbAP3VNhsoMK63.qRdrjkqpwTxcmPBi','teacher','Алина','Алексеевна ',1,'+79253002211','102'),(20,'rcp-03981290489@intake.local','$2b$10$H0lkFFjF1FnZBg/0rWTmJuo5pzYJrIVCcbpKBjju7OR7WsNoF2r36','recipient',NULL,NULL,NULL,NULL,NULL),(21,'rcp-21321321312@intake.local','$2b$10$M0PpbPCs6AvU1nMsE6NlGO10NzRAc/kvskoJ7VUsKKwebMmJa/Spi','recipient',NULL,NULL,NULL,NULL,NULL),(22,'rcp-21321321321@intake.local','$2b$10$/aa3eSf2IOq1cqFCP8dGcO3osqHAoxiJPI.JozmpQcvdoP5Zd5/5O','recipient',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'erpdb'
--

--
-- Dumping routines for database 'erpdb'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-17 11:17:34
