-- MySQL dump 10.13  Distrib 5.7.17, for macos10.12 (x86_64)
--
-- Host: localhost    Database: nalanda
-- ------------------------------------------------------
-- Server version	5.7.17

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can add permission',2,'add_permission'),(5,'Can change permission',2,'change_permission'),(6,'Can delete permission',2,'delete_permission'),(7,'Can add group',3,'add_group'),(8,'Can change group',3,'change_group'),(9,'Can delete group',3,'delete_group'),(10,'Can add user',4,'add_user'),(11,'Can change user',4,'change_user'),(12,'Can delete user',4,'delete_user'),(13,'Can add content type',5,'add_contenttype'),(14,'Can change content type',5,'change_contenttype'),(15,'Can delete content type',5,'delete_contenttype'),(16,'Can add session',6,'add_session'),(17,'Can change session',6,'change_session'),(18,'Can delete session',6,'delete_session'),(19,'Can add roles',7,'add_roles'),(20,'Can change roles',7,'change_roles'),(21,'Can delete roles',7,'delete_roles'),(22,'Can add user info class',8,'add_userinfoclass'),(23,'Can change user info class',8,'change_userinfoclass'),(24,'Can delete user info class',8,'delete_userinfoclass'),(25,'Can add user info school',9,'add_userinfoschool'),(26,'Can change user info school',9,'change_userinfoschool'),(27,'Can delete user info school',9,'delete_userinfoschool'),(28,'Can add user role collection mapping',10,'add_userrolecollectionmapping'),(29,'Can change user role collection mapping',10,'change_userrolecollectionmapping'),(30,'Can delete user role collection mapping',10,'delete_userrolecollectionmapping'),(31,'Can add users',11,'add_users'),(32,'Can change users',11,'change_users'),(33,'Can delete users',11,'delete_users'),(34,'Can add content',12,'add_content'),(35,'Can change content',12,'change_content'),(36,'Can delete content',12,'delete_content'),(37,'Can add latest fetch date',13,'add_latestfetchdate'),(38,'Can change latest fetch date',13,'change_latestfetchdate'),(39,'Can delete latest fetch date',13,'delete_latestfetchdate'),(40,'Can add mastery level class',14,'add_masterylevelclass'),(41,'Can change mastery level class',14,'change_masterylevelclass'),(42,'Can delete mastery level class',14,'delete_masterylevelclass'),(43,'Can add mastery level school',15,'add_masterylevelschool'),(44,'Can change mastery level school',15,'change_masterylevelschool'),(45,'Can delete mastery level school',15,'delete_masterylevelschool'),(46,'Can add mastery level student',16,'add_masterylevelstudent'),(47,'Can change mastery level student',16,'change_masterylevelstudent'),(48,'Can delete mastery level student',16,'delete_masterylevelstudent'),(49,'Can add user info student',17,'add_userinfostudent'),(50,'Can change user info student',17,'change_userinfostudent'),(51,'Can delete user info student',17,'delete_userinfostudent');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(12,'nalanda','content'),(13,'nalanda','latestfetchdate'),(14,'nalanda','masterylevelclass'),(15,'nalanda','masterylevelschool'),(16,'nalanda','masterylevelstudent'),(7,'nalanda','roles'),(8,'nalanda','userinfoclass'),(9,'nalanda','userinfoschool'),(17,'nalanda','userinfostudent'),(10,'nalanda','userrolecollectionmapping'),(11,'nalanda','users'),(6,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2017-07-07 18:52:06.043875'),(2,'auth','0001_initial','2017-07-07 18:52:06.895056'),(3,'admin','0001_initial','2017-07-07 18:52:07.115453'),(4,'admin','0002_logentry_remove_auto_add','2017-07-07 18:52:07.184138'),(5,'contenttypes','0002_remove_content_type_name','2017-07-07 18:52:07.422763'),(6,'auth','0002_alter_permission_name_max_length','2017-07-07 18:52:07.484942'),(7,'auth','0003_alter_user_email_max_length','2017-07-07 18:52:07.540434'),(8,'auth','0004_alter_user_username_opts','2017-07-07 18:52:07.570676'),(9,'auth','0005_alter_user_last_login_null','2017-07-07 18:52:07.662283'),(10,'auth','0006_require_contenttypes_0002','2017-07-07 18:52:07.668661'),(11,'auth','0007_alter_validators_add_error_messages','2017-07-07 18:52:07.696986'),(12,'auth','0008_alter_user_username_max_length','2017-07-07 18:52:07.782060'),(13,'nalanda','0001_initial','2017-07-07 18:52:08.384978'),(14,'sessions','0001_initial','2017-07-07 18:52:08.455940'),(15,'nalanda','0002_auto_20170714_1209','2017-07-14 16:09:48.136676');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_content`
--

DROP TABLE IF EXISTS `nalanda_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_content` (
  `topic_id` varchar(32) NOT NULL,
  `topic_name` varchar(140) NOT NULL,
  `content_id` varchar(32) NOT NULL,
  `channel_id` varchar(32) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `sub_topics` longtext NOT NULL,
  PRIMARY KEY (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_content`
--

LOCK TABLES `nalanda_content` WRITE;
/*!40000 ALTER TABLE `nalanda_content` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_latestfetchdate`
--

DROP TABLE IF EXISTS `nalanda_latestfetchdate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_latestfetchdate` (
  `date_id` int(11) NOT NULL,
  `latest_date` datetime(6) NOT NULL,
  PRIMARY KEY (`date_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_latestfetchdate`
--

LOCK TABLES `nalanda_latestfetchdate` WRITE;
/*!40000 ALTER TABLE `nalanda_latestfetchdate` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_latestfetchdate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_masterylevelclass`
--

DROP TABLE IF EXISTS `nalanda_masterylevelclass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_masterylevelclass` (
  `id` varchar(40) NOT NULL,
  `content_id` varchar(32) NOT NULL,
  `channel_id` varchar(32) NOT NULL,
  `date` datetime(6) NOT NULL,
  `completed_questions` int(11) NOT NULL,
  `correct_questions` int(11) NOT NULL,
  `attempt_questions` int(11) NOT NULL,
  `students_completed` int(11) NOT NULL,
  `class_id_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `nalanda_masterylevel_class_id_id_361baeb7_fk_nalanda_u` (`class_id_id`),
  CONSTRAINT `nalanda_masterylevel_class_id_id_361baeb7_fk_nalanda_u` FOREIGN KEY (`class_id_id`) REFERENCES `nalanda_userinfoclass` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_masterylevelclass`
--

LOCK TABLES `nalanda_masterylevelclass` WRITE;
/*!40000 ALTER TABLE `nalanda_masterylevelclass` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_masterylevelclass` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_masterylevelschool`
--

DROP TABLE IF EXISTS `nalanda_masterylevelschool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_masterylevelschool` (
  `id` varchar(40) NOT NULL,
  `content_id` varchar(32) NOT NULL,
  `channel_id` varchar(32) NOT NULL,
  `date` datetime(6) NOT NULL,
  `completed_questions` int(11) NOT NULL,
  `correct_questions` int(11) NOT NULL,
  `attempt_questions` int(11) NOT NULL,
  `students_completed` int(11) NOT NULL,
  `school_id_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `nalanda_masterylevel_school_id_id_aea33f2a_fk_nalanda_u` (`school_id_id`),
  CONSTRAINT `nalanda_masterylevel_school_id_id_aea33f2a_fk_nalanda_u` FOREIGN KEY (`school_id_id`) REFERENCES `nalanda_userinfoschool` (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_masterylevelschool`
--

LOCK TABLES `nalanda_masterylevelschool` WRITE;
/*!40000 ALTER TABLE `nalanda_masterylevelschool` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_masterylevelschool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_masterylevelstudent`
--

DROP TABLE IF EXISTS `nalanda_masterylevelstudent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_masterylevelstudent` (
  `id` varchar(40) NOT NULL,
  `content_id` varchar(32) NOT NULL,
  `channel_id` varchar(32) NOT NULL,
  `date` datetime(6) NOT NULL,
  `completed_questions` int(11) NOT NULL,
  `correct_questions` int(11) NOT NULL,
  `attempt_questions` int(11) NOT NULL,
  `completed` tinyint(1) NOT NULL,
  `student_id_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `nalanda_masterylevel_student_id_id_1f19f5b4_fk_nalanda_u` (`student_id_id`),
  CONSTRAINT `nalanda_masterylevel_student_id_id_1f19f5b4_fk_nalanda_u` FOREIGN KEY (`student_id_id`) REFERENCES `nalanda_userinfostudent` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_masterylevelstudent`
--

LOCK TABLES `nalanda_masterylevelstudent` WRITE;
/*!40000 ALTER TABLE `nalanda_masterylevelstudent` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_masterylevelstudent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_userinfoclass`
--

DROP TABLE IF EXISTS `nalanda_userinfoclass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_userinfoclass` (
  `class_id` bigint(20) NOT NULL,
  `class_name` varchar(60) NOT NULL,
  `total_students` int(11) NOT NULL,
  `parent` bigint(20) NOT NULL,
  PRIMARY KEY (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_userinfoclass`
--

LOCK TABLES `nalanda_userinfoclass` WRITE;
/*!40000 ALTER TABLE `nalanda_userinfoclass` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_userinfoclass` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_userinfoschool`
--

DROP TABLE IF EXISTS `nalanda_userinfoschool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_userinfoschool` (
  `school_id` bigint(20) NOT NULL,
  `school_name` varchar(60) NOT NULL,
  `total_students` int(11) NOT NULL,
  PRIMARY KEY (`school_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_userinfoschool`
--

LOCK TABLES `nalanda_userinfoschool` WRITE;
/*!40000 ALTER TABLE `nalanda_userinfoschool` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_userinfoschool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_userinfostudent`
--

DROP TABLE IF EXISTS `nalanda_userinfostudent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_userinfostudent` (
  `student_id` bigint(20) NOT NULL,
  `student_name` varchar(60) NOT NULL,
  `parent` bigint(20) NOT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_userinfostudent`
--

LOCK TABLES `nalanda_userinfostudent` WRITE;
/*!40000 ALTER TABLE `nalanda_userinfostudent` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_userinfostudent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_userrolecollectionmapping`
--

DROP TABLE IF EXISTS `nalanda_userrolecollectionmapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_userrolecollectionmapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `is_approved` tinyint(1) NOT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `class_id_id` bigint(20) DEFAULT NULL,
  `institute_id_id` bigint(20) DEFAULT NULL,
  `user_id_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `nalanda_userrolecoll_class_id_id_fd4330ad_fk_nalanda_u` (`class_id_id`),
  KEY `nalanda_userrolecoll_institute_id_id_4872f5bb_fk_nalanda_u` (`institute_id_id`),
  KEY `nalanda_userrolecoll_user_id_id_1cc50b0c_fk_nalanda_u` (`user_id_id`),
  CONSTRAINT `nalanda_userrolecoll_class_id_id_fd4330ad_fk_nalanda_u` FOREIGN KEY (`class_id_id`) REFERENCES `nalanda_userinfoclass` (`class_id`),
  CONSTRAINT `nalanda_userrolecoll_institute_id_id_4872f5bb_fk_nalanda_u` FOREIGN KEY (`institute_id_id`) REFERENCES `nalanda_userinfoschool` (`school_id`),
  CONSTRAINT `nalanda_userrolecoll_user_id_id_1cc50b0c_fk_nalanda_u` FOREIGN KEY (`user_id_id`) REFERENCES `nalanda_users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_userrolecollectionmapping`
--

LOCK TABLES `nalanda_userrolecollectionmapping` WRITE;
/*!40000 ALTER TABLE `nalanda_userrolecollectionmapping` DISABLE KEYS */;
/*!40000 ALTER TABLE `nalanda_userrolecollectionmapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nalanda_users`
--

DROP TABLE IF EXISTS `nalanda_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nalanda_users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(60) NOT NULL,
  `last_name` varchar(60) NOT NULL,
  `username` varchar(60) NOT NULL,
  `password` varchar(60) NOT NULL,
  `email` varchar(60) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `number_of_failed_attempts` int(11) NOT NULL,
  `last_login_time` datetime(6) DEFAULT NULL,
  `create_date` datetime(6) NOT NULL,
  `update_date` datetime(6) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nalanda_users`
--

LOCK TABLES `nalanda_users` WRITE;
/*!40000 ALTER TABLE `nalanda_users` DISABLE KEYS */;
INSERT INTO `nalanda_users` VALUES (1,'bh','jb','jh','j','jn',0,0,NULL,'2017-07-09 18:07:45.214779',NULL,1);
/*!40000 ALTER TABLE `nalanda_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-07-14 13:11:42
