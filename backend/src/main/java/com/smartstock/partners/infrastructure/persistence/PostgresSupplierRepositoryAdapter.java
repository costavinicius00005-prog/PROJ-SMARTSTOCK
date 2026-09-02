package com.smartstock.partners.infrastructure.persistence;

import com.smartstock.partners.application.port.SupplierRepositoryPort;
import com.smartstock.partners.domain.Supplier;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PostgresSupplierRepositoryAdapter implements SupplierRepositoryPort {
  private final JdbcClient jdbc;
  public PostgresSupplierRepositoryAdapter(JdbcClient jdbc) { this.jdbc = jdbc; }

  @Override @Transactional(readOnly = true)
  public List<Supplier> list() {
    return jdbc.sql("SELECT * FROM suppliers ORDER BY name").query(this::map).list();
  }

  @Override @Transactional(readOnly = true)
  public boolean existsByCpf(String cpf) {
    return jdbc.sql("SELECT EXISTS(SELECT 1 FROM suppliers WHERE cpf = :cpf)").param("cpf", cpf).query(Boolean.class).single();
  }

  @Override @Transactional(readOnly = true)
  public boolean existsByCnpj(String cnpj) {
    return jdbc.sql("SELECT EXISTS(SELECT 1 FROM suppliers WHERE cnpj = :cnpj)").param("cnpj", cnpj).query(Boolean.class).single();
  }

  @Override @Transactional
  public Supplier save(Supplier s) {
    jdbc.sql("""
        INSERT INTO suppliers (id, supplier_type, cpf, cnpj, name, trade_name, email, primary_phone,
          birth_date, rg, gender, mother_name, father_name, primary_contact_name, zip_code, address,
          address_number, complement, district, state, city)
        VALUES (:id, :supplierType, :cpf, :cnpj, :name, :tradeName, :email, :primaryPhone,
          :birthDate, :rg, :gender, :motherName, :fatherName, :primaryContactName, :zipCode, :address,
          :addressNumber, :complement, :district, :state, :city)
        """).params(parameters(s)).update();
    return s;
  }

  @Override @Transactional
  public void deleteById(UUID id) { jdbc.sql("DELETE FROM suppliers WHERE id = :id").param("id", id).update(); }

  private Supplier map(ResultSet rs, int row) throws SQLException {
    return new Supplier(rs.getObject("id", UUID.class), rs.getString("supplier_type"), rs.getString("cpf"),
        rs.getString("cnpj"), rs.getString("name"), rs.getString("trade_name"), rs.getString("email"),
        rs.getString("primary_phone"), rs.getObject("birth_date", java.time.LocalDate.class), rs.getString("rg"),
        rs.getString("gender"), rs.getString("mother_name"), rs.getString("father_name"),
        rs.getString("primary_contact_name"), rs.getString("zip_code"), rs.getString("address"),
        rs.getString("address_number"), rs.getString("complement"), rs.getString("district"),
        rs.getString("state"), rs.getString("city"));
  }

  private Map<String, Object> parameters(Supplier s) {
    Map<String, Object> values = new HashMap<>();
    values.put("id", s.id()); values.put("supplierType", s.supplierType()); values.put("cpf", s.cpf());
    values.put("cnpj", s.cnpj()); values.put("name", s.name()); values.put("tradeName", s.tradeName());
    values.put("email", s.email()); values.put("primaryPhone", s.primaryPhone()); values.put("birthDate", s.birthDate());
    values.put("rg", s.rg()); values.put("gender", s.gender()); values.put("motherName", s.motherName());
    values.put("fatherName", s.fatherName()); values.put("primaryContactName", s.primaryContactName());
    values.put("zipCode", s.zipCode()); values.put("address", s.address()); values.put("addressNumber", s.addressNumber());
    values.put("complement", s.complement()); values.put("district", s.district()); values.put("state", s.state()); values.put("city", s.city());
    return values;
  }
}
