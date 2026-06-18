-- MySQL dump 10.13  Distrib 9.7.0, for Win64 (x86_64)
--
-- Host: localhost    Database: erpdbnew
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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '1b49fe35-5378-11f1-a97d-74563c652715:1-221';

--
-- Current Database: `erpdbnew`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `erpdbnew` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `erpdbnew`;

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
  KEY `idRecipient` (`idRecipient`),
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
INSERT INTO `crgrecipientsec` VALUES (1,167),(1,168);
/*!40000 ALTER TABLE `crgrecipientsec` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `legalrepresentatives`
--

LOCK TABLES `legalrepresentatives` WRITE;
/*!40000 ALTER TABLE `legalrepresentatives` DISABLE KEYS */;
INSERT INTO `legalrepresentatives` VALUES (1,'Елена','Викторовна','Морозова','+79169876543','morozova.ev@example.com','4516','123456','ОВД района Хамовники г. Москвы','2015-06-20','770-001','г. Москва, ул. Льва Толстого, д. 16, кв. 5'),(9,'Ваня','ФЫВФЫВ','Иванов','+79883172371','lr-79883172371@intake.local','9012','123321','офлывлй','2001-10-10','300-122','йцшушщйц');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipientdocs`
--

LOCK TABLES `recipientdocs` WRITE;
/*!40000 ALTER TABLE `recipientdocs` DISABLE KEYS */;
INSERT INTO `recipientdocs` VALUES (1,1,'Свидетельство','IX-МЮ','654321','Хамовнический отдел ЗАГС г. Москвы','2015-09-25','123-456-789 01','2024-01-15','2027-01-15','г. Москва, ул. Льва Толстого, д. 16, кв. 5','г. Москва, ул. Льва Толстого, д. 16, кв. 5',1,'ГБОУ Школа № 1234, г. Москва','Нуждается в индивидуальном сопровождении; чувствителен к громким звукам. Любит рисование и музыкальные занятия.'),(3,8,'Паспорт','2211','321111','ыыыввваааааааааа','2010-02-01','123-123-30-021','2003-03-20','2005-05-20','ыфв','ыфв',1,'ыфв','');
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipients`
--

LOCK TABLES `recipients` WRITE;
/*!40000 ALTER TABLE `recipients` DISABLE KEYS */;
INSERT INTO `recipients` VALUES (1,3,'Роман','Дмитриевич','Морозов','2015-09-14','roman.morozov@example.com','+79169876544',_binary 'https://i.pravatar.cc/300?img=12',1,'active','Ребенок-инвалид','РАС (расстройство аутистического спектра)',5,1,14),(8,11,'Андрей','нету','Алексеев','2003-02-20','rcp-12312330021@intake.local','+79883172371','',9,'draft','Нет','ЫЫЫ',2,NULL,1);
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
  `curator` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `curator` (`curator`),
  CONSTRAINT `regroup_ibfk_1` FOREIGN KEY (`curator`) REFERENCES `specialists` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regroup`
--

LOCK TABLES `regroup` WRITE;
/*!40000 ALTER TABLE `regroup` DISABLE KEYS */;
INSERT INTO `regroup` VALUES (1,'Группа «Солнышко»',1),(3,'Диагностика',1);
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
  CONSTRAINT `reresults_ibfk_2` FOREIGN KEY (`idSpecialist`) REFERENCES `specialists` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `reresults_ibfk_3` FOREIGN KEY (`idDirection`) REFERENCES `direction` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reresults`
--

LOCK TABLES `reresults` WRITE;
/*!40000 ALTER TABLE `reresults` DISABLE KEYS */;
/*!40000 ALTER TABLE `reresults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialistdirect`
--

DROP TABLE IF EXISTS `specialistdirect`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialistdirect` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idSpecialist` int NOT NULL,
  `idDirection` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idSpecialist` (`idSpecialist`),
  KEY `idDirection` (`idDirection`),
  CONSTRAINT `specialistdirect_ibfk_1` FOREIGN KEY (`idSpecialist`) REFERENCES `specialists` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `specialistdirect_ibfk_2` FOREIGN KEY (`idDirection`) REFERENCES `direction` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialistdirect`
--

LOCK TABLES `specialistdirect` WRITE;
/*!40000 ALTER TABLE `specialistdirect` DISABLE KEYS */;
/*!40000 ALTER TABLE `specialistdirect` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialists`
--

DROP TABLE IF EXISTS `specialists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullName` varchar(150) NOT NULL,
  `dateBirth` date NOT NULL,
  `cabinet` varchar(3) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `spec_telephone` (`telephone`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialists`
--

LOCK TABLES `specialists` WRITE;
/*!40000 ALTER TABLE `specialists` DISABLE KEYS */;
INSERT INTO `specialists` VALUES (1,'Соколова Мария Андреевна','1985-03-12','204','+79161234501');
/*!40000 ALTER TABLE `specialists` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'mininis@social.mos.ru','$2a$10$S9p.FzVcu2vEbrxSagsTGu6G6wwGIh5YieF3Rx0ZRAthKD8xKt23.','admin'),(2,'teacher@social.mos.ru','$2b$10$HesCUcmcC/T02Hbx6kHoS.WYrvM3woJlxQfvZeESJKLOm8jUYbeFe','teacher'),(3,'roman.morozov@example.com','$2b$10$Pq6ethmKWk5eX2VLXMlpTuEfhOOwAfvkRdXCPKnV2qigFuJU3YUMq','recipient'),(4,'petrova.employee@social.mos.ru','$2b$10$eAtszFe/Q771hBIbsPZ5gOwA/wvFbo8/XUDVB0z1rFrKdHKuIihb.','employee'),(11,'rcp-12312330021@intake.local','$2b$10$oJu48DgItpVkThTFsc4lzu8ABKcIURc6jD0jn83uG8X4UUkwqQJ4q','recipient');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'erpdbnew'
--

--
-- Dumping routines for database 'erpdbnew'
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

-- Dump completed on 2026-06-18 17:33:50
